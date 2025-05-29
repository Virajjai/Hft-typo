#!/usr/bin/env python3

import logging
import json
import csv
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from pathlib import Path

logger = logging.getLogger("backtest")

class Backtest:
    """
    Backtesting Engine
    
    Simulates trading strategies on historical data
    to evaluate performance before live trading.
    """
    
    def __init__(self, strategy_class, strategy_params=None, risk_params=None):
        """
        Initialize backtester
        
        Args:
            strategy_class (class): Strategy class to backtest
            strategy_params (dict, optional): Strategy parameters
            risk_params (dict, optional): Risk parameters
        """
        self.strategy_class = strategy_class
        self.strategy_params = strategy_params or {}
        self.risk_params = risk_params or {}
        
        # Data
        self.data = {}
        self.instruments = []
        
        # Results
        self.trades = []
        self.positions = {}
        self.equity_curve = []
        self.performance_metrics = {}
    
    def load_csv_data(self, file_path, instrument=None):
        """
        Load historical data from CSV file
        
        Args:
            file_path (str): Path to CSV file
            instrument (str, optional): Instrument name (defaults to filename)
            
        Format expected:
        - timestamp, open, high, low, close, volume
        - timestamp format: YYYY-MM-DD HH:MM:SS
        """
        # Determine instrument name if not provided
        if instrument is None:
            instrument = Path(file_path).stem
        
        # Add to instruments list
        if instrument not in self.instruments:
            self.instruments.append(instrument)
        
        # Read CSV file
        try:
            df = pd.read_csv(file_path)
            
            # Convert timestamp to datetime
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df.set_index('timestamp', inplace=True)
            
            # Store data
            self.data[instrument] = df
            
            logger.info(f"Loaded {len(df)} records for {instrument}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error loading data from {file_path}: {e}")
            return False
    
    def prepare_tick_data(self):
        """
        Prepare tick data from OHLCV data
        
        This converts candle data to simulated tick data
        for more realistic backesting.
        """
        for instrument, df in self.data.items():
            # Check if we have the necessary columns
            required_columns = ['open', 'high', 'low', 'close', 'volume']
            if not all(col in df.columns for col in required_columns):
                logger.error(f"Missing required columns for {instrument}")
                continue
            
            # Create tick dataframe
            ticks = []
            
            for idx, row in df.iterrows():
                # Generate synthetic ticks from OHLC
                # We'll create 5 synthetic ticks per candle
                
                # Prices follow a path from open -> high/low -> close
                # This is a simple approximation, not perfect
                if row['close'] > row['open']:
                    # Upward candle
                    prices = [
                        row['open'],
                        (row['open'] + row['high']) / 2,
                        row['high'],
                        (row['high'] + row['close']) / 2,
                        row['close']
                    ]
                else:
                    # Downward candle
                    prices = [
                        row['open'],
                        (row['open'] + row['low']) / 2,
                        row['low'],
                        (row['low'] + row['close']) / 2,
                        row['close']
                    ]
                
                # Distribute volume across ticks
                volumes = np.random.dirichlet(np.ones(5), size=1)[0] * row['volume']
                
                # Create ticks with timestamps distributed within the candle
                for i in range(5):
                    # Calculate timestamp offset (fraction of the candle period)
                    offset = timedelta(minutes=(i+1) * 0.2)
                    
                    tick = {
                        'timestamp': idx + offset,
                        'instrument': instrument,
                        'ltp': prices[i],
                        'volume': volumes[i],
                        'bid': prices[i] * 0.999,  # Approximate bid/ask
                        'ask': prices[i] * 1.001
                    }
                    ticks.append(tick)
            
            # Store tick data
            self.data[instrument + '_ticks'] = pd.DataFrame(ticks)
            
            logger.info(f"Generated {len(ticks)} synthetic ticks for {instrument}")
    
    def run(self, start_date=None, end_date=None, initial_capital=100000):
        """
        Run backtest
        
        Args:
            start_date (str, optional): Start date (YYYY-MM-DD)
            end_date (str, optional): End date (YYYY-MM-DD)
            initial_capital (float, optional): Initial capital
            
        Returns:
            dict: Performance metrics
        """
        # Convert dates to datetime
        if start_date:
            start_date = pd.to_datetime(start_date)
        if end_date:
            end_date = pd.to_datetime(end_date)
        
        # Create strategy instance
        strategy = self.strategy_class(
            name="Backtest",
            instruments=self.instruments,
            risk_params=self.risk_params
        )
        
        # Apply strategy-specific parameters
        for key, value in self.strategy_params.items():
            if hasattr(strategy, key):
                setattr(strategy, key, value)
        
        # Initialize backtest variables
        self.trades = []
        self.positions = {}
        self.equity_curve = []
        
        # Initial equity
        equity = initial_capital
        self.equity_curve.append({
            'timestamp': start_date or pd.Timestamp.min,
            'equity': equity
        })
        
        # Collect all tick data across instruments
        all_ticks = []
        
        for instrument in self.instruments:
            # Get tick data if available, otherwise use OHLCV
            if instrument + '_ticks' in self.data:
                df = self.data[instrument + '_ticks']
            else:
                # Convert OHLCV to basic tick format
                df = self.data[instrument].copy()
                df['instrument'] = instrument
                df['ltp'] = df['close']
                
                # Rename index to timestamp column
                df = df.reset_index()
            
            # Apply date filters
            if start_date:
                df = df[df['timestamp'] >= start_date]
            if end_date:
                df = df[df['timestamp'] <= end_date]
            
            # Add to all ticks
            all_ticks.append(df)
        
        # Combine and sort by timestamp
        if all_ticks:
            all_ticks_df = pd.concat(all_ticks).sort_values('timestamp')
        else:
            logger.error("No tick data available")
            return None
        
        # Process each tick
        for _, tick in all_ticks_df.iterrows():
            # Create tick data dict
            tick_data = {
                'instrument': tick['instrument'],
                'ltp': tick['ltp'],
                'volume': tick.get('volume', 0),
                'bid': tick.get('bid', tick['ltp'] * 0.999),
                'ask': tick.get('ask', tick['ltp'] * 1.001),
                'timestamp': tick['timestamp'].isoformat()
            }
            
            # Update strategy with tick data
            self.process_tick(strategy, tick_data)
            
            # Calculate current equity
            current_equity = self.calculate_equity(initial_capital)
            
            # Update equity curve
            self.equity_curve.append({
                'timestamp': tick['timestamp'],
                'equity': current_equity
            })
        
        # Calculate performance metrics
        self.performance_metrics = self.calculate_performance_metrics(initial_capital)
        
        return self.performance_metrics
    
    def process_tick(self, strategy, tick_data):
        """
        Process a single tick
        
        Args:
            strategy: Strategy instance
            tick_data (dict): Tick data
        """
        # Get instrument
        instrument = tick_data['instrument']
        
        # Update market data
        strategy.market_data[instrument] = tick_data
        
        # Call strategy's tick handler (synchronously for backtest)
        self.process_strategy_signals(strategy, tick_data)
        
        # Update positions with current prices
        for ins, position in self.positions.items():
            if ins == instrument:
                position['current_price'] = tick_data['ltp']
    
    def process_strategy_signals(self, strategy, tick_data):
        """
        Process strategy signals
        
        Args:
            strategy: Strategy instance
            tick_data (dict): Tick data
        """
        # Let strategy generate signals
        signals = strategy.generate_signals()
        
        # Process signals
        for signal in signals:
            self.execute_signal(signal, tick_data['timestamp'])
    
    def execute_signal(self, signal, timestamp):
        """
        Execute a trading signal
        
        Args:
            signal (dict): Trading signal
            timestamp (str): Current timestamp
        """
        instrument = signal.get('instrument')
        action = signal.get('action')
        quantity = signal.get('quantity', 0)
        price = signal.get('price')
        order_type = signal.get('order_type', 'LIMIT')
        
        # Use market price if not specified or for market orders
        if not price or order_type == 'MARKET':
            price = self.market_data.get(instrument, {}).get('ltp', 0)
        
        # Skip if no price available
        if not price:
            logger.warning(f"No price available for {instrument}, skipping signal")
            return
        
        # Execute trade
        trade = {
            'instrument': instrument,
            'action': action,
            'quantity': quantity,
            'price': price,
            'timestamp': timestamp,
            'order_type': order_type
        }
        
        # Log trade
        logger.info(f"Executing trade: {json.dumps(trade)}")
        
        # Update positions
        self.update_position(trade)
        
        # Add to trades list
        self.trades.append(trade)
    
    def update_position(self, trade):
        """
        Update position based on trade
        
        Args:
            trade (dict): Trade data
        """
        instrument = trade['instrument']
        action = trade['action']
        quantity = trade['quantity']
        price = trade['price']
        
        # Initialize position if not exists
        if instrument not in self.positions:
            self.positions[instrument] = {
                'quantity': 0,
                'avg_price': 0,
                'current_price': price,
                'realized_pnl': 0
            }
        
        position = self.positions[instrument]
        
        # Calculate trade value
        trade_value = quantity * price
        
        if action == 'BUY':
            # Update average price for buys
            if position['quantity'] + quantity != 0:
                position['avg_price'] = (position['quantity'] * position['avg_price'] + trade_value) / (position['quantity'] + quantity)
            
            position['quantity'] += quantity
        
        elif action == 'SELL':
            # Calculate realized P&L for sells
            if position['quantity'] > 0:
                # Selling long position
                realized_pnl = (price - position['avg_price']) * min(quantity, position['quantity'])
                position['realized_pnl'] += realized_pnl
            
            position['quantity'] -= quantity
            
            # If position flips to short, reset average price
            if position['quantity'] < 0 and position['quantity'] + quantity > 0:
                position['avg_price'] = price
        
        # Update current price
        position['current_price'] = price
    
    def calculate_equity(self, initial_capital):
        """
        Calculate current equity
        
        Args:
            initial_capital (float): Initial capital
            
        Returns:
            float: Current equity
        """
        # Start with initial capital
        equity = initial_capital
        
        # Add realized P&L
        for position in self.positions.values():
            equity += position.get('realized_pnl', 0)
        
        # Add unrealized P&L
        for position in self.positions.values():
            quantity = position.get('quantity', 0)
            avg_price = position.get('avg_price', 0)
            current_price = position.get('current_price', 0)
            
            if quantity != 0 and avg_price != 0 and current_price != 0:
                unrealized_pnl = (current_price - avg_price) * quantity
                equity += unrealized_pnl
        
        return equity
    
    def calculate_performance_metrics(self, initial_capital):
        """
        Calculate performance metrics
        
        Args:
            initial_capital (float): Initial capital
            
        Returns:
            dict: Performance metrics
        """
        # Convert equity curve to dataframe
        equity_df = pd.DataFrame(self.equity_curve)
        
        if equity_df.empty:
            logger.error("No equity curve data available")
            return {}
        
        # Calculate returns
        equity_df['return'] = equity_df['equity'].pct_change()
        
        # Calculate metrics
        total_return = (equity_df['equity'].iloc[-1] / initial_capital) - 1
        annual_return = total_return * (252 / len(equity_df)) if len(equity_df) > 0 else 0
        
        # Calculate drawdown
        equity_df['cummax'] = equity_df['equity'].cummax()
        equity_df['drawdown'] = (equity_df['cummax'] - equity_df['equity']) / equity_df['cummax']
        max_drawdown = equity_df['drawdown'].max()
        
        # Calculate Sharpe ratio (assuming risk-free rate of 0)
        daily_returns = equity_df['return'].dropna()
        sharpe_ratio = (daily_returns.mean() / daily_returns.std()) * np.sqrt(252) if len(daily_returns) > 0 and daily_returns.std() > 0 else 0
        
        # Calculate win rate
        if len(self.trades) > 0:
            winning_trades = sum(1 for trade in self.trades if trade.get('pnl', 0) > 0)
            win_rate = winning_trades / len(self.trades)
        else:
            win_rate = 0
        
        # Return metrics
        return {
            'initial_capital': initial_capital,
            'final_equity': round(equity_df['equity'].iloc[-1], 2),
            'total_return': round(total_return * 100, 2),
            'annual_return': round(annual_return * 100, 2),
            'max_drawdown': round(max_drawdown * 100, 2),
            'sharpe_ratio': round(sharpe_ratio, 2),
            'win_rate': round(win_rate * 100, 2),
            'total_trades': len(self.trades),
            'equity_curve': equity_df.to_dict(orient='records')
        }
    
    def plot_equity_curve(self, filename=None):
        """
        Plot equity curve
        
        Args:
            filename (str, optional): File to save plot to
        """
        if not self.equity_curve:
            logger.error("No equity curve data available")
            return
        
        # Convert to dataframe
        equity_df = pd.DataFrame(self.equity_curve)
        equity_df.set_index('timestamp', inplace=True)
        
        # Create figure
        plt.figure(figsize=(12, 6))
        
        # Plot equity curve
        plt.plot(equity_df.index, equity_df['equity'], label='Equity')
        
        # Add drawdown
        equity_df['cummax'] = equity_df['equity'].cummax()
        plt.plot(equity_df.index, equity_df['cummax'], linestyle='--', color='green', alpha=0.5, label='Peak Equity')
        
        # Add labels and title
        plt.title('Backtest Equity Curve')
        plt.xlabel('Date')
        plt.ylabel('Equity')
        plt.legend()
        plt.grid(True, alpha=0.3)
        
        # Save or show
        if filename:
            plt.savefig(filename)
            logger.info(f"Equity curve saved to {filename}")
        else:
            plt.show()
    
    def generate_report(self, filename=None):
        """
        Generate backtest report
        
        Args:
            filename (str, optional): File to save report to
            
        Returns:
            str: Report as JSON string
        """
        if not self.performance_metrics:
            logger.error("No performance metrics available")
            return "{}"
        
        # Create report
        report = {
            'strategy': self.strategy_class.__name__,
            'instruments': self.instruments,
            'parameters': self.strategy_params,
            'risk_parameters': self.risk_params,
            'performance': self.performance_metrics,
            'trades_summary': self.get_trades_summary(),
            'positions': self.positions
        }
        
        # Convert to JSON
        report_json = json.dumps(report, indent=2)
        
        # Save to file
        if filename:
            with open(filename, 'w') as f:
                f.write(report_json)
            logger.info(f"Backtest report saved to {filename}")
        
        return report_json
    
    def get_trades_summary(self):
        """
        Get summary of trades
        
        Returns:
            dict: Trades summary
        """
        if not self.trades:
            return {}
        
        # Count trades by instrument
        trades_by_instrument = {}
        for trade in self.trades:
            instrument = trade['instrument']
            action = trade['action']
            
            if instrument not in trades_by_instrument:
                trades_by_instrument[instrument] = {'BUY': 0, 'SELL': 0}
            
            trades_by_instrument[instrument][action] += 1
        
        return {
            'total_trades': len(self.trades),
            'by_instrument': trades_by_instrument,
            'first_trade_time': self.trades[0]['timestamp'],
            'last_trade_time': self.trades[-1]['timestamp']
        }


# Example usage
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # This would be imported from strategy.py in real usage
    class DummyStrategy:
        def __init__(self, name, instruments, risk_params=None):
            self.name = name
            self.instruments = instruments
            self.risk_params = risk_params or {}
            self.market_data = {}
        
        def generate_signals(self):
            # Simple dummy strategy - buy when price increases, sell when it decreases
            signals = []
            
            for instrument, data in self.market_data.items():
                # Need at least 2 data points
                if instrument not in self.price_history or len(self.price_history[instrument]) < 2:
                    continue
                
                current_price = data['ltp']
                prev_price = self.price_history[instrument][-1]
                
                if current_price > prev_price * 1.01:  # 1% increase
                    signals.append({
                        'instrument': instrument,
                        'action': 'BUY',
                        'quantity': 10,
                        'order_type': 'MARKET'
                    })
                elif current_price < prev_price * 0.99:  # 1% decrease
                    signals.append({
                        'instrument': instrument,
                        'action': 'SELL',
                        'quantity': 10,
                        'order_type': 'MARKET'
                    })
            
            return signals
        
        def on_tick(self, tick_data):
            # Update price history
            instrument = tick_data['instrument']
            
            if not hasattr(self, 'price_history'):
                self.price_history = {}
            
            if instrument not in self.price_history:
                self.price_history[instrument] = []
            
            self.price_history[instrument].append(tick_data['ltp'])
            
            # Keep only last 10 prices
            if len(self.price_history[instrument]) > 10:
                self.price_history[instrument] = self.price_history[instrument][-10:]
    
    # Create and run backtest
    backtest = Backtest(
        strategy_class=DummyStrategy,
        strategy_params={'param1': 'value1'},
        risk_params={'max_position_size': 100}
    )
    
    # In a real implementation, you would load CSV data here
    # backtest.load_csv_data('data/NIFTY_1min.csv', 'NIFTY')
    
    # For this example, we'll create synthetic data
    import numpy as np
    import pandas as pd
    from datetime import datetime, timedelta
    
    # Create synthetic price data
    start_date = datetime(2023, 1, 1)
    dates = [start_date + timedelta(minutes=i) for i in range(1000)]
    
    # Random walk price
    price = 1000
    prices = [price]
    for _ in range(999):
        change = np.random.normal(0, 10)
        price += change
        prices.append(price)
    
    # Create dataframe
    df = pd.DataFrame({
        'timestamp': dates,
        'open': prices,
        'high': [p * (1 + np.random.uniform(0, 0.01)) for p in prices],
        'low': [p * (1 - np.random.uniform(0, 0.01)) for p in prices],
        'close': [p * (1 + np.random.normal(0, 0.005)) for p in prices],
        'volume': [np.random.randint(100, 1000) for _ in prices]
    })
    
    # Set timestamp as index
    df.set_index('timestamp', inplace=True)
    
    # Add to backtest data
    backtest.data['NIFTY'] = df
    backtest.instruments = ['NIFTY']
    
    # Prepare tick data
    backtest.prepare_tick_data()
    
    # Run backtest
    results = backtest.run(initial_capital=100000)
    
    # Print results
    if results:
        print(f"Backtest Results: {json.dumps(results, indent=2)}")
        
        # Plot equity curve
        # backtest.plot_equity_curve('equity_curve.png')
        
        # Generate report
        report = backtest.generate_report('backtest_report.json')