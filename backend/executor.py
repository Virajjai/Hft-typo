#!/usr/bin/env python3

import logging
import asyncio
import json
import time
from datetime import datetime
from kite_api import KiteAPI

logger = logging.getLogger("executor")

class OrderExecutor:
    """
    Order Executor
    
    Handles order execution, modification, cancellation,
    and tracks execution metrics like latency and fill rates.
    """
    
    def __init__(self, kite_api=None):
        """
        Initialize executor
        
        Args:
            kite_api (KiteAPI, optional): Instance of KiteAPI
        """
        self.kite_api = kite_api or KiteAPI()
        
        # Order tracking
        self.orders = {}
        self.order_latencies = []
        
        # Metrics
        self.total_orders = 0
        self.filled_orders = 0
        self.rejected_orders = 0
        self.avg_latency_ms = 0
    
    async def place_order(self, instrument, transaction_type, quantity, price=None, order_type="LIMIT", strategy_name=None):
        """
        Place an order
        
        Args:
            instrument (str): Trading symbol
            transaction_type (str): "BUY" or "SELL"
            quantity (int): Number of shares or contracts
            price (float, optional): Order price (required for LIMIT orders)
            order_type (str, optional): "MARKET" or "LIMIT"
            strategy_name (str, optional): Name of the strategy placing the order
            
        Returns:
            dict: Order response with order_id if successful
        """
        start_time = time.time()
        
        # Create order object
        order_data = {
            "instrument": instrument,
            "transaction_type": transaction_type,
            "quantity": quantity,
            "order_type": order_type,
            "strategy": strategy_name,
            "timestamp": datetime.now().isoformat(),
            "status": "PENDING"
        }
        
        # Add price for LIMIT orders
        if order_type == "LIMIT" and price:
            order_data["price"] = price
        
        # Generate unique order ID (in real implementation, this would come from the exchange)
        order_id = f"ORD{self.total_orders + 1:06d}"
        order_data["order_id"] = order_id
        
        # Log order
        logger.info(f"Placing order: {json.dumps(order_data)}")
        
        # Place order via Kite API
        try:
            # In a real implementation, this would be:
            # response = await self.kite_api.place_order(...)
            
            # Simulate API call
            await asyncio.sleep(0.05)  # Simulate 50ms API latency
            
            # Simulate success (90% success rate)
            import random
            if random.random() < 0.9:
                response = {"status": "success", "order_id": order_id}
                order_data["status"] = "OPEN"
            else:
                response = {"status": "error", "message": "Insufficient funds"}
                order_data["status"] = "REJECTED"
                order_data["rejection_reason"] = "Insufficient funds"
                self.rejected_orders += 1
            
            # Store order
            self.orders[order_id] = order_data
            self.total_orders += 1
            
            # Calculate and store latency
            latency_ms = (time.time() - start_time) * 1000
            self.order_latencies.append(latency_ms)
            self.update_metrics()
            
            # Log latency
            logger.info(f"Order {order_id} placed with latency: {latency_ms:.2f}ms")
            
            return order_data
        
        except Exception as e:
            logger.error(f"Error placing order: {e}")
            
            order_data["status"] = "ERROR"
            order_data["error"] = str(e)
            
            return order_data
    
    async def modify_order(self, order_id, price=None, quantity=None):
        """
        Modify an existing order
        
        Args:
            order_id (str): Order ID to be modified
            price (float, optional): New price
            quantity (int, optional): New quantity
            
        Returns:
            dict: Order response
        """
        start_time = time.time()
        
        # Check if order exists
        if order_id not in self.orders:
            logger.error(f"Order {order_id} not found")
            return {"status": "error", "message": "Order not found"}
        
        order = self.orders[order_id]
        
        # Check if order can be modified
        if order["status"] not in ["OPEN", "PENDING"]:
            logger.error(f"Cannot modify order {order_id} with status {order['status']}")
            return {"status": "error", "message": f"Cannot modify order with status {order['status']}"}
        
        # Update order
        if price:
            order["price"] = price
        if quantity:
            order["quantity"] = quantity
        
        # Log modification
        logger.info(f"Modifying order {order_id}: price={price}, quantity={quantity}")
        
        # Modify order via Kite API
        try:
            # In a real implementation, this would be:
            # response = await self.kite_api.modify_order(...)
            
            # Simulate API call
            await asyncio.sleep(0.05)  # Simulate 50ms API latency
            
            # Simulate success (95% success rate)
            import random
            if random.random() < 0.95:
                response = {"status": "success", "order_id": order_id}
            else:
                response = {"status": "error", "message": "Order already executed"}
                order["status"] = "COMPLETE"
                self.filled_orders += 1
            
            # Calculate and store latency
            latency_ms = (time.time() - start_time) * 1000
            self.order_latencies.append(latency_ms)
            self.update_metrics()
            
            # Log latency
            logger.info(f"Order {order_id} modified with latency: {latency_ms:.2f}ms")
            
            return order
        
        except Exception as e:
            logger.error(f"Error modifying order: {e}")
            return {"status": "error", "message": str(e)}
    
    async def cancel_order(self, order_id):
        """
        Cancel an order
        
        Args:
            order_id (str): Order ID to be cancelled
            
        Returns:
            dict: Response
        """
        start_time = time.time()
        
        # Check if order exists
        if order_id not in self.orders:
            logger.error(f"Order {order_id} not found")
            return {"status": "error", "message": "Order not found"}
        
        order = self.orders[order_id]
        
        # Check if order can be cancelled
        if order["status"] not in ["OPEN", "PENDING"]:
            logger.error(f"Cannot cancel order {order_id} with status {order['status']}")
            return {"status": "error", "message": f"Cannot cancel order with status {order['status']}"}
        
        # Log cancellation
        logger.info(f"Cancelling order {order_id}")
        
        # Cancel order via Kite API
        try:
            # In a real implementation, this would be:
            # response = await self.kite_api.cancel_order(...)
            
            # Simulate API call
            await asyncio.sleep(0.05)  # Simulate 50ms API latency
            
            # Simulate success (98% success rate)
            import random
            if random.random() < 0.98:
                response = {"status": "success"}
                order["status"] = "CANCELLED"
            else:
                response = {"status": "error", "message": "Order already executed"}
                order["status"] = "COMPLETE"
                self.filled_orders += 1
            
            # Calculate and store latency
            latency_ms = (time.time() - start_time) * 1000
            self.order_latencies.append(latency_ms)
            self.update_metrics()
            
            # Log latency
            logger.info(f"Order {order_id} cancelled with latency: {latency_ms:.2f}ms")
            
            return order
        
        except Exception as e:
            logger.error(f"Error cancelling order: {e}")
            return {"status": "error", "message": str(e)}
    
    async def cancel_all_orders(self, instrument=None, strategy=None):
        """
        Cancel all open orders
        
        Args:
            instrument (str, optional): Cancel only orders for this instrument
            strategy (str, optional): Cancel only orders for this strategy
            
        Returns:
            int: Number of orders cancelled
        """
        cancelled = 0
        
        for order_id, order in list(self.orders.items()):
            # Skip if not OPEN or PENDING
            if order["status"] not in ["OPEN", "PENDING"]:
                continue
            
            # Skip if instrument filter is applied and doesn't match
            if instrument and order["instrument"] != instrument:
                continue
            
            # Skip if strategy filter is applied and doesn't match
            if strategy and order.get("strategy") != strategy:
                continue
            
            # Cancel order
            result = await self.cancel_order(order_id)
            
            if result.get("status") != "error":
                cancelled += 1
        
        logger.info(f"Cancelled {cancelled} orders")
        return cancelled
    
    async def get_order(self, order_id):
        """
        Get order details
        
        Args:
            order_id (str): Order ID
            
        Returns:
            dict: Order details
        """
        if order_id in self.orders:
            return self.orders[order_id]
        
        # In a real implementation, this would fetch from Kite API if not found locally
        logger.error(f"Order {order_id} not found")
        return {"status": "error", "message": "Order not found"}
    
    async def get_orders(self, instrument=None, status=None, strategy=None):
        """
        Get all orders with optional filtering
        
        Args:
            instrument (str, optional): Filter by instrument
            status (str, optional): Filter by status
            strategy (str, optional): Filter by strategy
            
        Returns:
            list: List of orders
        """
        filtered_orders = []
        
        for order in self.orders.values():
            # Apply filters
            if instrument and order["instrument"] != instrument:
                continue
            
            if status and order["status"] != status:
                continue
            
            if strategy and order.get("strategy") != strategy:
                continue
            
            filtered_orders.append(order)
        
        return filtered_orders
    
    def update_metrics(self):
        """Update execution metrics"""
        # Calculate average latency
        if self.order_latencies:
            self.avg_latency_ms = sum(self.order_latencies) / len(self.order_latencies)
        
        # Calculate fill rate
        if self.total_orders > 0:
            self.fill_rate = self.filled_orders / self.total_orders
        else:
            self.fill_rate = 0
    
    def get_metrics(self):
        """Get execution metrics"""
        return {
            "total_orders": self.total_orders,
            "filled_orders": self.filled_orders,
            "rejected_orders": self.rejected_orders,
            "avg_latency_ms": round(self.avg_latency_ms, 2),
            "fill_rate": round(self.fill_rate * 100, 2) if hasattr(self, 'fill_rate') else 0,
        }


# Example usage
if __name__ == "__main__":
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    # Create order executor
    executor = OrderExecutor()
    
    # Run example
    async def run_example():
        # Place a buy order
        buy_order = await executor.place_order(
            instrument="RELIANCE",
            transaction_type="BUY",
            quantity=10,
            price=2345.50,
            order_type="LIMIT",
            strategy_name="Example"
        )
        
        # Place a sell order
        sell_order = await executor.place_order(
            instrument="INFY",
            transaction_type="SELL",
            quantity=5,
            price=1845.25,
            order_type="LIMIT",
            strategy_name="Example"
        )
        
        # Modify buy order
        await executor.modify_order(
            order_id=buy_order["order_id"],
            price=2350.00
        )
        
        # Cancel sell order
        await executor.cancel_order(
            order_id=sell_order["order_id"]
        )
        
        # Get metrics
        metrics = executor.get_metrics()
        print(f"Execution Metrics: {json.dumps(metrics, indent=2)}")
    
    # Run the example
    asyncio.run(run_example())