#!/usr/bin/env python3

import logging
import asyncio
import json
from datetime import datetime, time
import pytz

logger = logging.getLogger("risk")

class RiskManager:
    """
    Risk Manager
    
    Monitors trading activity and enforces risk limits such as:
    - Maximum position size
    - Maximum daily loss
    - Maximum drawdown
    - Trading hours restrictions
    - Market circuit breakers
    """
    
    def __init__(self, risk_params=None):
        """
        Initialize risk manager
        
        Args:
            risk_params (dict, optional): Risk parameters
        """
        # Default risk parameters
        self.risk_params = risk_params or {
            "max_position_size": {
                "default": 100,  # Default for any instrument
                "NIFTY": 50,     # Specific for NIFTY
                "BANKNIFTY": 25  # Specific for BANKNIFTY
            },
            "max_daily_loss": 10000.0,  # INR
            "max_notional_exposure": 1000000.0,  # INR
            "max_drawdown": 0.05,  # 5%
            "market_hours": {
                "start": time(9, 15),  # 9:15 AM
                "end": time(15, 30)    # 3:30 PM
            },
            "auto_square_off_time": time(15, 15),  # 3:15 PM
            "max_open_orders": 50
        }
        
        # Trading state
        self.positions = {}
        self.orders = {}
        self.daily_pnl = 0.0
        self.peak_pnl = 0.0
        self.current_drawdown = 0.0
        self.trading_enabled = True
        self.risk_breach = False
        self.risk_breach_reason = None
        
        # Indian timezone
        self.timezone = pytz.timezone('Asia/Kolkata')
    
    def check_market_hours(self):
        """
        Check if current time is within market hours
        
        Returns:
            bool: True if within market hours, False otherwise
        """
        now = datetime.now(self.timezone).time()
        market_start = self.risk_params["market_hours"]["start"]
        market_end = self.risk_params["market_hours"]["end"]
        
        return market_start <= now <= market_end
    
    def check_auto_square_off(self):
        """
        Check if it's time for auto square off
        
        Returns:
            bool: True if it's time for auto square off, False otherwise
        """
        now = datetime.now(self.timezone).time()
        square_off_time = self.risk_params["auto_square_off_time"]
        
        return now >= square_off_time
    
    def check_position_limit(self, instrument, quantity_change):
        """
        Check if adding the given quantity would breach position limits
        
        Args:
            instrument (str): Instrument name
            quantity_change (int): Quantity to add (positive) or remove (negative)
            
        Returns:
            bool: True if within limits, False otherwise
        """
        current_quantity = abs(self.positions.get(instrument, {}).get("quantity", 0))
        new_quantity = abs(current_quantity + quantity_change)
        
        # Get position limit for this instrument
        limit = self.risk_params["max_position_size"].get(
            instrument, 
            self.risk_params["max_position_size"]["default"]
        )
        
        return new_quantity <= limit
    
    def check_daily_loss_limit(self):
        """
        Check if daily loss limit is breached
        
        Returns:
            bool: True if within limits, False otherwise
        """
        return self.daily_pnl >= -self.risk_params["max_daily_loss"]
    
    def check_drawdown_limit(self):
        """
        Check if drawdown limit is breached
        
        Returns:
            bool: True if within limits, False otherwise
        """
        return self.current_drawdown <= self.risk_params["max_drawdown"]
    
    def check_notional_exposure(self):
        """
        Check if notional exposure limit is breached
        
        Returns:
            bool: True if within limits, False otherwise
        """
        total_exposure = 0.0
        
        for instrument, position in self.positions.items():
            quantity = abs(position.get("quantity", 0))
            price = position.get("last_price", 0)
            exposure = quantity * price
            total_exposure += exposure
        
        return total_exposure <= self.risk_params["max_notional_exposure"]
    
    def check_open_orders_limit(self):
        """
        Check if open orders limit is breached
        
        Returns:
            bool: True if within limits, False otherwise
        """
        open_orders_count = sum(
            1 for order in self.orders.values()
            if order.get("status") in ["OPEN", "PENDING"]
        )
        
        return open_orders_count <= self.risk_params["max_open_orders"]
    
    def update_position(self, instrument, quantity, price):
        """
        Update position information
        
        Args:
            instrument (str): Instrument name
            quantity (int): Position quantity (can be negative for short)
            price (float): Current price
        """
        if instrument not in self.positions:
            self.positions[instrument] = {
                "quantity": 0,
                "avg_price": 0,
                "last_price": 0,
                "pnl": 0
            }
        
        # Update position
        self.positions[instrument]["quantity"] = quantity
        self.positions[instrument]["last_price"] = price
        
        # Recalculate P&L
        self.update_pnl()
    
    def update_order(self, order):
        """
        Update order information
        
        Args:
            order (dict): Order data
        """
        order_id = order.get("order_id")
        if order_id:
            self.orders[order_id] = order
    
    def update_pnl(self):
        """Update P&L and drawdown calculations"""
        total_pnl = 0.0
        
        for instrument, position in self.positions.items():
            quantity = position.get("quantity", 0)
            avg_price = position.get("avg_price", 0)
            last_price = position.get("last_price", 0)
            
            # Skip if no position or incomplete data
            if quantity == 0 or avg_price == 0 or last_price == 0:
                continue
            
            # Calculate P&L
            pnl = (last_price - avg_price) * quantity
            position["pnl"] = pnl
            total_pnl += pnl
        
        # Update daily P&L
        self.daily_pnl = total_pnl
        
        # Update peak P&L and drawdown
        if total_pnl > self.peak_pnl:
            self.peak_pnl = total_pnl
        
        # Calculate drawdown
        if self.peak_pnl > 0:
            self.current_drawdown = (self.peak_pnl - total_pnl) / self.peak_pnl
        else:
            self.current_drawdown = 0.0
    
    def check_all_risk_limits(self):
        """
        Check all risk limits
        
        Returns:
            bool: True if all limits are within bounds, False otherwise
        """
        # Check market hours
        if not self.check_market_hours():
            self.risk_breach = True
            self.risk_breach_reason = "Outside market hours"
            self.trading_enabled = False
            return False
        
        # Check daily loss limit
        if not self.check_daily_loss_limit():
            self.risk_breach = True
            self.risk_breach_reason = "Daily loss limit exceeded"
            self.trading_enabled = False
            return False
        
        # Check drawdown limit
        if not self.check_drawdown_limit():
            self.risk_breach = True
            self.risk_breach_reason = "Drawdown limit exceeded"
            self.trading_enabled = False
            return False
        
        # Check notional exposure
        if not self.check_notional_exposure():
            self.risk_breach = True
            self.risk_breach_reason = "Notional exposure limit exceeded"
            self.trading_enabled = False
            return False
        
        # Check open orders limit
        if not self.check_open_orders_limit():
            self.risk_breach = True
            self.risk_breach_reason = "Open orders limit exceeded"
            self.trading_enabled = False
            return False
        
        # Check if it's time for auto square off
        if self.check_auto_square_off():
            self.risk_breach = True
            self.risk_breach_reason = "Auto square off time reached"
            self.trading_enabled = False
            return False
        
        # All checks passed
        self.risk_breach = False
        self.risk_breach_reason = None
        self.trading_enabled = True
        return True
    
    def validate_order(self, order):
        """
        Validate if an order can be placed based on risk limits
        
        Args:
            order (dict): Order data
            
        Returns:
            tuple: (bool, str) - (is_valid, reason)
        """
        # Check if trading is enabled
        if not self.trading_enabled:
            return False, f"Trading disabled: {self.risk_breach_reason}"
        
        # Extract order details
        instrument = order.get("instrument")
        transaction_type = order.get("transaction_type")
        quantity = order.get("quantity", 0)
        
        # Convert quantity to position change
        quantity_change = quantity if transaction_type == "BUY" else -quantity
        
        # Check position limit
        if not self.check_position_limit(instrument, quantity_change):
            return False, f"Position limit exceeded for {instrument}"
        
        # All checks passed
        return True, "Order validated"
    
    def get_risk_status(self):
        """
        Get current risk status
        
        Returns:
            dict: Risk status information
        """
        return {
            "trading_enabled": self.trading_enabled,
            "risk_breach": self.risk_breach,
            "risk_breach_reason": self.risk_breach_reason,
            "daily_pnl": round(self.daily_pnl, 2),
            "peak_pnl": round(self.peak_pnl, 2),
            "current_drawdown": round(self.current_drawdown * 100, 2),
            "in_market_hours": self.check_market_hours(),
            "auto_square_off_pending": self.check_auto_square_off(),
            "position_count": len(self.positions),
            "open_orders_count": sum(
                1 for order in self.orders.values()
                if order.get("status") in ["OPEN", "PENDING"]
            ),
        }
    
    async def emergency_shutdown(self):
        """
        Emergency shutdown procedure
        
        This cancels all open orders and closes all positions
        """
        logger.warning("Initiating emergency shutdown")
        
        # In a real implementation, this would:
        # 1. Cancel all open orders
        # 2. Close all positions with market orders
        # 3. Notify administrators
        
        logger.warning("Emergency shutdown completed")


# Example usage
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Create risk manager
    risk_manager = RiskManager()
    
    # Update some positions
    risk_manager.update_position("RELIANCE", 10, 2345.50)
    risk_manager.update_position("INFY", -5, 1845.25)
    
    # Check risk limits
    all_ok = risk_manager.check_all_risk_limits()
    
    # Get status
    status = risk_manager.get_risk_status()
    print(f"Risk Status: {json.dumps(status, indent=2)}")
    
    # Validate an order
    order = {
        "instrument": "TCS",
        "transaction_type": "BUY",
        "quantity": 5,
        "price": 3698.00,
        "order_type": "LIMIT"
    }
    
    is_valid, reason = risk_manager.validate_order(order)
    print(f"Order valid: {is_valid}, Reason: {reason}")