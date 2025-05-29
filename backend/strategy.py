#!/usr/bin/env python3

import logging
import asyncio
import json
from datetime import datetime
from abc import ABC, abstractmethod
import numpy as np

logger = logging.getLogger("strategy")

class Strategy(ABC):
    """Base Strategy class that all strategies should inherit from"""
    
    def __init__(self, name, instruments, risk_params=None):
        """
        Initialize strategy
        
        Args:
            name (str): Strategy name
            instruments (list): List of instruments to trade
            risk_params (dict, optional): Risk parameters
        """
        self.name = name
        self.instruments = instruments
        self.risk_params = risk_params or {
            "max_position_size": 100,
            "max_daily_loss": 5000,  # INR
            "max_open_orders": 10,
            "max_drawdown": 0.05,  # 5%
        }
        
        # Strategy state
        self.active = False
        self.market_data = {}
        self.positions = {}
        self.orders = {}
        self.pnl = 0
        self.trades_today = 0
        self.start_time = None
        
        # Performance metrics
        self.win_count = 0
        self.loss_count = 0
        self.total_pnl = 0
        self.max_drawdown = 0
        self.peak_pnl = 0
    
    @abstractmethod
    async def on_tick(self, tick_data):
        """
        Process market data tick
        
        Args:
            tick_data (dict): Tick data for an instrument
        """
        pass
    
    @abstractmethod
    async def generate_signals(self):
        """Generate trading signals based on market data"""
        pass
    
    @abstractmethod
    async def execute_signals(self, signals):
        """
        Execute trading signals
        
        Args:
            signals (list): List of signal dictionaries
        """
        pass
    
    async def start(self):
        """Start the strategy"""
        if not self.active:
            logger.info(f"Starting strategy: {self.name}")
            self.active = True
            self.start_time = datetime.now()
            await self.on_start()
    
    async def stop(self):
        """Stop the strategy"""
        if self.active:
            logger.info(f"Stopping strategy: {self.name}")
            self.active = False
            await self.on_stop()
    
    async def on_start(self):
        """Called when strategy starts"""
        pass
    
    async def on_stop(self):
        """Called when strategy stops"""
        pass
    
    async def update_market_data(self, tick_data):
        """
        Update market data and process tick
        
        Args:
            tick_data (dict): Tick data for an instrument
        """
        if not self.active:
            return
        
        instrument = tick_data.get("instrument")
        if instrument in self.instruments:
            self.market_data[instrument] = tick_data
            await self.on_tick(tick_data)
    
    async def update_position(self, position_data):
        """
        Update position information
        
        Args:
            position_data (dict): Position data
        """
        instrument = position_data.get("instrument")
        if instrument in self.instruments:
            self.positions[instrument] = position_data
    
    async def update_order(self, order_data):
        """
        Update order information
        
        Args:
            order_data (dict): Order data
        """
        order_id = order_data.get("order_id")
        self.orders[order_id] = order_data
        
        # If order is complete, update trade count
        if order_data.get("status") == "COMPLETE":
            self.trades_today += 1
    
    def update_pnl(self, pnl):
        """
        Update strategy P&L
        
        Args:
            pnl (float): Current P&L
        """
        # Update total P&L
        self.pnl = pnl
        self.total_pnl = pnl
        
        # Update peak P&L and drawdown
        if pnl > self.peak_pnl:
            self.peak_pnl = pnl
        else:
            drawdown = (self.peak_pnl - pnl) / self.peak_pnl if self.peak_pnl > 0 else 0
            self.max_drawdown = max(self.max_drawdown, drawdown)
        
        # Check risk limits
        self.check_risk_limits()
    
    def check_risk_limits(self):
        """Check if any risk limits are breached"""
        # Check max daily loss
        if self.pnl < -self.risk_params["max_daily_loss"]:
            logger.warning(f"Strategy {self.name}: Max daily loss limit reached. P&L: {self.pnl}")
            return False
        
        # Check max drawdown
        if self.max_drawdown > self.risk_params["max_drawdown"]:
            logger.warning(f"Strategy {self.name}: Max drawdown limit reached. Drawdown: {self.max_drawdown:.2%}")
            return False
        
        # Check max open orders
        if len([o for o in self.orders.values() if o.get("status") == "PENDING"]) > self.risk_params["max_open_orders"]:
            logger.warning(f"Strategy {self.name}: Max open orders limit reached.")
            return False
        
        # Check max position size for each instrument
        for instrument, position in self.positions.items():
            if abs(position.get("quantity", 0)) > self.risk_params["max_position_size"]:
                logger.warning(f"Strategy {self.name}: Max position size limit reached for {instrument}.")
                return False
        
        return True
    
    def get_status(self):
        """Get strategy status"""
        win_rate = (self.win_count / (self.win_count + self.loss_count)) * 100 if (self.win_count + self.loss_count) > 0 else 0
        
        return {
            "name": self.name,
            "status": "active" if self.active else "paused",
            "instruments": self.instruments,
            "pnl": self.pnl,
            "trades": self.trades_today,
            "win_rate": round(win_rate, 2),
            "max_drawdown": round(self.max_drawdown * 100, 2),
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "positions": list(self.positions.values()),
        }


class MarketMakingStrategy(Strategy):
    """
    Market Making Strategy
    
    Continuously posts bid and ask orders around the mid price
    with a defined spread, and adjusts orders as the market moves.
    """
    
    def __init__(self, name, instruments, risk_params=None, strategy_params=None):
        super().__init__(name, instruments, risk_params)
        
        # Strategy-specific parameters
        self.strategy_params = strategy_params or {
            "spread_percentage": 0.05,  # 0.05% spread around mid price
            "order_quantity": 10,  # Quantity per order
            "position_limit": 50,  # Max absolute position
            "min_price_increment": 0.05,  # Minimum price increment
            "cancel_replace_threshold": 0.02,  # % price move to trigger cancel/replace
        }
        
        # Order tracking
        self.active_bids = {}  # instrument -> order_id
        self.active_asks = {}  # instrument -> order_id
        self.last_mid_prices = {}  # instrument -> price
    
    async def on_start(self):
        """Called when strategy starts"""
        logger.info(f"Market Making strategy {self.name} started")
    
    async def on_stop(self):
        """Called when strategy stops"""
        logger.info(f"Market Making strategy {self.name} stopped")
        
        # Cancel all open orders
        await self.cancel_all_orders()
    
    async def on_tick(self, tick_data):
        """Process market data tick"""
        if not self.active:
            return
        
        instrument = tick_data.get("instrument")
        
        # Get current mid price
        bid = tick_data.get("bid", 0)
        ask = tick_data.get("ask", 0)
        mid_price = (bid + ask) / 2 if bid and ask else tick_data.get("ltp", 0)
        
        # Store last mid price
        last_mid = self.last_mid_prices.get(instrument, 0)
        self.last_mid_prices[instrument] = mid_price
        
        # Check if price moved enough to cancel and replace orders
        price_change_pct = abs(mid_price - last_mid) / last_mid if last_mid else 0
        
        if price_change_pct > self.strategy_params["cancel_replace_threshold"]:
            # Cancel existing orders and create new ones
            await self.cancel_instrument_orders(instrument)
            await asyncio.sleep(0.1)  # Small delay to ensure orders are cancelled
            await self.create_market_making_orders(instrument, mid_price)
    
    async def generate_signals(self):
        """Generate trading signals"""
        signals = []
        
        for instrument, data in self.market_data.items():
            # Get current position
            position = self.positions.get(instrument, {"quantity": 0}).get("quantity", 0)
            
            # Get current mid price
            bid = data.get("bid", 0)
            ask = data.get("ask", 0)
            mid_price = (bid + ask) / 2 if bid and ask else data.get("ltp", 0)
            
            # Check if we need to create new orders
            bid_order_id = self.active_bids.get(instrument)
            ask_order_id = self.active_asks.get(instrument)
            
            if not bid_order_id and position < self.strategy_params["position_limit"]:
                # Create new bid
                signals.append({
                    "instrument": instrument,
                    "action": "BUY",
                    "price": self.calculate_bid_price(mid_price),
                    "quantity": self.strategy_params["order_quantity"]
                })
            
            if not ask_order_id and abs(position) < self.strategy_params["position_limit"]:
                # Create new ask
                signals.append({
                    "instrument": instrument,
                    "action": "SELL",
                    "price": self.calculate_ask_price(mid_price),
                    "quantity": self.strategy_params["order_quantity"]
                })
        
        return signals
    
    async def execute_signals(self, signals):
        """Execute trading signals"""
        for signal in signals:
            instrument = signal.get("instrument")
            action = signal.get("action")
            price = signal.get("price")
            quantity = signal.get("quantity")
            
            # Place order through API
            # In a real implementation, this would call the KiteAPI
            order = {
                "instrument": instrument,
                "transaction_type": action,
                "quantity": quantity,
                "price": price,
                "order_type": "LIMIT"
            }
            
            # Log the order
            logger.info(f"Placing order: {json.dumps(order)}")
            
            # Track the order
            order_id = f"ORD{hash(f'{instrument}{action}{price}{quantity}{datetime.now().timestamp()}')}"
            
            if action == "BUY":
                self.active_bids[instrument] = order_id
            else:
                self.active_asks[instrument] = order_id
    
    async def cancel_all_orders(self):
        """Cancel all open orders"""
        for instrument in self.instruments:
            await self.cancel_instrument_orders(instrument)
    
    async def cancel_instrument_orders(self, instrument):
        """Cancel orders for a specific instrument"""
        # Cancel bid
        bid_order_id = self.active_bids.get(instrument)
        if bid_order_id:
            logger.info(f"Cancelling bid order {bid_order_id} for {instrument}")
            # In a real implementation, this would call the KiteAPI
            self.active_bids[instrument] = None
        
        # Cancel ask
        ask_order_id = self.active_asks.get(instrument)
        if ask_order_id:
            logger.info(f"Cancelling ask order {ask_order_id} for {instrument}")
            # In a real implementation, this would call the KiteAPI
            self.active_asks[instrument] = None
    
    async def create_market_making_orders(self, instrument, mid_price):
        """Create market making orders around mid price"""
        # Get current position
        position = self.positions.get(instrument, {"quantity": 0}).get("quantity", 0)
        
        # Create bid if position < limit
        if position < self.strategy_params["position_limit"]:
            bid_price = self.calculate_bid_price(mid_price)
            
            # Place bid order through API
            # In a real implementation, this would call the KiteAPI
            bid_order = {
                "instrument": instrument,
                "transaction_type": "BUY",
                "quantity": self.strategy_params["order_quantity"],
                "price": bid_price,
                "order_type": "LIMIT"
            }
            
            # Log the order
            logger.info(f"Placing bid order: {json.dumps(bid_order)}")
            
            # Track the order
            bid_order_id = f"ORD{hash(f'{instrument}BUY{bid_price}{self.strategy_params['order_quantity']}{datetime.now().timestamp()}')}"
            self.active_bids[instrument] = bid_order_id
        
        # Create ask if abs(position) < limit
        if abs(position) < self.strategy_params["position_limit"]:
            ask_price = self.calculate_ask_price(mid_price)
            
            # Place ask order through API
            # In a real implementation, this would call the KiteAPI
            ask_order = {
                "instrument": instrument,
                "transaction_type": "SELL",
                "quantity": self.strategy_params["order_quantity"],
                "price": ask_price,
                "order_type": "LIMIT"
            }
            
            # Log the order
            logger.info(f"Placing ask order: {json.dumps(ask_order)}")
            
            # Track the order
            ask_order_id = f"ORD{hash(f'{instrument}SELL{ask_price}{self.strategy_params['order_quantity']}{datetime.now().timestamp()}')}"
            self.active_asks[instrument] = ask_order_id
    
    def calculate_bid_price(self, mid_price):
        """Calculate bid price based on mid price and spread"""
        spread = mid_price * self.strategy_params["spread_percentage"]
        price = mid_price - spread
        
        # Round to minimum price increment
        increment = self.strategy_params["min_price_increment"]
        return round(price / increment) * increment
    
    def calculate_ask_price(self, mid_price):
        """Calculate ask price based on mid price and spread"""
        spread = mid_price * self.strategy_params["spread_percentage"]
        price = mid_price + spread
        
        # Round to minimum price increment
        increment = self.strategy_params["min_price_increment"]
        return round(price / increment) * increment


class MomentumStrategy(Strategy):
    """
    Momentum Strategy
    
    Buys when price is trending up with increasing volume,
    sells when price is trending down with increasing volume.
    """
    
    def __init__(self, name, instruments, risk_params=None, strategy_params=None):
        super().__init__(name, instruments, risk_params)
        
        # Strategy-specific parameters
        self.strategy_params = strategy_params or {
            "ma_short_period": 10,  # Short moving average period
            "ma_long_period": 30,  # Long moving average period
            "volume_threshold": 1.5,  # Volume increase factor to confirm momentum
            "position_size": 25,  # Fixed position size
            "take_profit_pct": 0.01,  # 1% take profit
            "stop_loss_pct": 0.005,  # 0.5% stop loss
        }
        
        # Price and volume history
        self.price_history = {instrument: [] for instrument in instruments}
        self.volume_history = {instrument: [] for instrument in instruments}
        
        # Positions and orders
        self.strategy_positions = {instrument: 0 for instrument in instruments}
        self.entry_prices = {}
    
    async def on_start(self):
        """Called when strategy starts"""
        logger.info(f"Momentum strategy {self.name} started")
    
    async def on_stop(self):
        """Called when strategy stops"""
        logger.info(f"Momentum strategy {self.name} stopped")
        
        # Close all positions
        await self.close_all_positions()
    
    async def on_tick(self, tick_data):
        """Process market data tick"""
        if not self.active:
            return
        
        instrument = tick_data.get("instrument")
        price = tick_data.get("ltp", 0)
        volume = tick_data.get("volume", 0)
        
        # Update price and volume history
        self.price_history[instrument].append(price)
        self.volume_history[instrument].append(volume)
        
        # Keep only necessary history
        max_history = max(
            self.strategy_params["ma_short_period"],
            self.strategy_params["ma_long_period"]
        ) + 10  # Add some buffer
        
        if len(self.price_history[instrument]) > max_history:
            self.price_history[instrument] = self.price_history[instrument][-max_history:]
            self.volume_history[instrument] = self.volume_history[instrument][-max_history:]
        
        # Check for entry/exit signals
        if len(self.price_history[instrument]) >= self.strategy_params["ma_long_period"]:
            # Check stop loss and take profit for existing positions
            position = self.strategy_positions.get(instrument, 0)
            
            if position != 0:
                entry_price = self.entry_prices.get(instrument, 0)
                
                if position > 0:  # Long position
                    pnl_pct = (price - entry_price) / entry_price
                    
                    if pnl_pct >= self.strategy_params["take_profit_pct"]:
                        # Take profit
                        await self.close_position(instrument)
                    elif pnl_pct <= -self.strategy_params["stop_loss_pct"]:
                        # Stop loss
                        await self.close_position(instrument)
                
                elif position < 0:  # Short position
                    pnl_pct = (entry_price - price) / entry_price
                    
                    if pnl_pct >= self.strategy_params["take_profit_pct"]:
                        # Take profit
                        await self.close_position(instrument)
                    elif pnl_pct <= -self.strategy_params["stop_loss_pct"]:
                        # Stop loss
                        await self.close_position(instrument)
    
    async def generate_signals(self):
        """Generate trading signals"""
        signals = []
        
        for instrument in self.instruments:
            # Skip if we don't have enough data
            if len(self.price_history[instrument]) < self.strategy_params["ma_long_period"]:
                continue
            
            # Get current position
            position = self.strategy_positions.get(instrument, 0)
            
            # Calculate indicators
            signal = self.calculate_momentum_signal(instrument)
            
            if signal == "BUY" and position <= 0:
                # Close any short position first
                if position < 0:
                    signals.append({
                        "instrument": instrument,
                        "action": "BUY",
                        "quantity": abs(position),
                        "order_type": "MARKET",
                        "reason": "close_short"
                    })
                
                # Enter long position
                signals.append({
                    "instrument": instrument,
                    "action": "BUY",
                    "quantity": self.strategy_params["position_size"],
                    "order_type": "MARKET",
                    "reason": "enter_long"
                })
            
            elif signal == "SELL" and position >= 0:
                # Close any long position first
                if position > 0:
                    signals.append({
                        "instrument": instrument,
                        "action": "SELL",
                        "quantity": position,
                        "order_type": "MARKET",
                        "reason": "close_long"
                    })
                
                # Enter short position
                signals.append({
                    "instrument": instrument,
                    "action": "SELL",
                    "quantity": self.strategy_params["position_size"],
                    "order_type": "MARKET",
                    "reason": "enter_short"
                })
        
        return signals
    
    async def execute_signals(self, signals):
        """Execute trading signals"""
        for signal in signals:
            instrument = signal.get("instrument")
            action = signal.get("action")
            quantity = signal.get("quantity")
            order_type = signal.get("order_type")
            reason = signal.get("reason")
            
            # Place order through API
            # In a real implementation, this would call the KiteAPI
            order = {
                "instrument": instrument,
                "transaction_type": action,
                "quantity": quantity,
                "order_type": order_type
            }
            
            # Log the order
            logger.info(f"Placing order: {json.dumps(order)} (Reason: {reason})")
            
            # Update strategy position
            if action == "BUY":
                self.strategy_positions[instrument] = self.strategy_positions.get(instrument, 0) + quantity
                if reason == "enter_long":
                    # Record entry price for take profit/stop loss
                    self.entry_prices[instrument] = self.price_history[instrument][-1]
            else:  # SELL
                self.strategy_positions[instrument] = self.strategy_positions.get(instrument, 0) - quantity
                if reason == "enter_short":
                    # Record entry price for take profit/stop loss
                    self.entry_prices[instrument] = self.price_history[instrument][-1]
    
    async def close_all_positions(self):
        """Close all positions"""
        for instrument, position in self.strategy_positions.items():
            if position != 0:
                await self.close_position(instrument)
    
    async def close_position(self, instrument):
        """Close position for a specific instrument"""
        position = self.strategy_positions.get(instrument, 0)
        
        if position == 0:
            return
        
        # Determine action and quantity
        action = "SELL" if position > 0 else "BUY"
        quantity = abs(position)
        
        # Place order through API
        # In a real implementation, this would call the KiteAPI
        order = {
            "instrument": instrument,
            "transaction_type": action,
            "quantity": quantity,
            "order_type": "MARKET"
        }
        
        # Log the order
        logger.info(f"Closing position: {json.dumps(order)}")
        
        # Update strategy position
        self.strategy_positions[instrument] = 0
        
        # Remove entry price
        if instrument in self.entry_prices:
            del self.entry_prices[instrument]
    
    def calculate_momentum_signal(self, instrument):
        """Calculate momentum signal based on MA crossover and volume"""
        prices = np.array(self.price_history[instrument])
        volumes = np.array(self.volume_history[instrument])
        
        # Calculate moving averages
        ma_short = np.mean(prices[-self.strategy_params["ma_short_period"]:])
        ma_long = np.mean(prices[-self.strategy_params["ma_long_period"]:])
        
        # Calculate average volume
        avg_volume = np.mean(volumes[-self.strategy_params["ma_short_period"]:])
        current_volume = volumes[-1]
        
        # Generate signal based on MA crossover and volume confirmation
        if ma_short > ma_long and current_volume > avg_volume * self.strategy_params["volume_threshold"]:
            return "BUY"
        elif ma_short < ma_long and current_volume > avg_volume * self.strategy_params["volume_threshold"]:
            return "SELL"
        else:
            return "NEUTRAL"


# Strategy manager to handle multiple strategies
class StrategyManager:
    """
    Strategy Manager
    
    Manages multiple trading strategies, handles their lifecycle,
    and distributes market data to appropriate strategies.
    """
    
    def __init__(self):
        self.strategies = {}
    
    def add_strategy(self, strategy):
        """Add a strategy to the manager"""
        self.strategies[strategy.name] = strategy
        logger.info(f"Added strategy: {strategy.name}")
    
    def remove_strategy(self, strategy_name):
        """Remove a strategy from the manager"""
        if strategy_name in self.strategies:
            del self.strategies[strategy_name]
            logger.info(f"Removed strategy: {strategy_name}")
    
    async def start_all(self):
        """Start all strategies"""
        for strategy in self.strategies.values():
            await strategy.start()
    
    async def stop_all(self):
        """Stop all strategies"""
        for strategy in self.strategies.values():
            await strategy.stop()
    
    async def start_strategy(self, strategy_name):
        """Start a specific strategy"""
        if strategy_name in self.strategies:
            await self.strategies[strategy_name].start()
    
    async def stop_strategy(self, strategy_name):
        """Stop a specific strategy"""
        if strategy_name in self.strategies:
            await self.strategies[strategy_name].stop()
    
    async def update_market_data(self, tick_data):
        """
        Update market data for all strategies
        
        Args:
            tick_data (dict): Tick data for an instrument
        """
        instrument = tick_data.get("instrument")
        
        for strategy in self.strategies.values():
            if instrument in strategy.instruments:
                await strategy.update_market_data(tick_data)
    
    async def update_order(self, order_data):
        """
        Update order information for all strategies
        
        Args:
            order_data (dict): Order data
        """
        for strategy in self.strategies.values():
            await strategy.update_order(order_data)
    
    async def update_position(self, position_data):
        """
        Update position information for all strategies
        
        Args:
            position_data (dict): Position data
        """
        instrument = position_data.get("instrument")
        
        for strategy in self.strategies.values():
            if instrument in strategy.instruments:
                await strategy.update_position(position_data)
    
    async def run_strategies(self):
        """Run active strategies to generate and execute signals"""
        for strategy in self.strategies.values():
            if strategy.active:
                signals = await strategy.generate_signals()
                if signals:
                    await strategy.execute_signals(signals)
    
    def get_strategy_status(self, strategy_name=None):
        """Get status of a specific strategy or all strategies"""
        if strategy_name:
            if strategy_name in self.strategies:
                return self.strategies[strategy_name].get_status()
            return None
        
        return [strategy.get_status() for strategy in self.strategies.values()]


# Example usage
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Create strategy manager
    manager = StrategyManager()
    
    # Create and add strategies
    market_making = MarketMakingStrategy(
        name="NIFTY Market Making",
        instruments=["NIFTY", "NIFTY-FUT"],
    )
    
    momentum = MomentumStrategy(
        name="Bank Momentum",
        instruments=["HDFC", "ICICI", "SBI", "KOTAK"],
    )
    
    manager.add_strategy(market_making)
    manager.add_strategy(momentum)
    
    # Start all strategies
    asyncio.run(manager.start_all())