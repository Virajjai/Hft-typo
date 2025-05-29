#!/usr/bin/env python3

import os
import json
import logging
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kite-api")

class KiteAPI:
    """
    Wrapper class for Zerodha Kite Connect API
    
    This class handles authentication, token renewal, and provides
    methods for various API endpoints like order placement and market data.
    """
    
    def __init__(self):
        # Kite Connect API endpoints
        self.base_url = "https://api.kite.trade"
        self.login_url = "https://kite.trade/connect/login"
        
        # API credentials
        self.api_key = os.getenv("KITE_API_KEY")
        self.api_secret = os.getenv("KITE_API_SECRET")
        self.access_token = os.getenv("KITE_ACCESS_TOKEN")
        
        # Check if credentials exist
        if not self.api_key or not self.api_secret:
            logger.warning("Kite API credentials not found in environment variables")
        
        # Session and headers
        self.session = requests.Session()
        self.set_headers()
        
        # Token expiry tracking
        self.token_expiry = datetime.now() + timedelta(days=1)
    
    def set_headers(self):
        """Set the necessary headers for API requests"""
        self.headers = {
            "X-Kite-Version": "3",
            "User-Agent": "Zerodha HFT System/1.0",
        }
        
        if self.access_token:
            self.headers["Authorization"] = f"token {self.api_key}:{self.access_token}"
        
        self.session.headers.update(self.headers)
    
    def login(self):
        """
        Generate login URL for user authentication
        
        In a real implementation, this would be part of a web-based OAuth flow
        where users are redirected to Kite login page.
        """
        return f"{self.login_url}?api_key={self.api_key}&v=3"
    
    def generate_session(self, request_token):
        """
        Generate session by exchanging request token for access token
        """
        try:
            url = f"{self.base_url}/session/token"
            data = {
                "api_key": self.api_key,
                "request_token": request_token,
                "checksum": self.generate_checksum(request_token)
            }
            
            response = self.session.post(url, data=data)
            response.raise_for_status()
            
            data = response.json()["data"]
            self.access_token = data["access_token"]
            self.set_headers()
            
            # Save access token for future use
            # In a production system, this would be stored securely
            os.environ["KITE_ACCESS_TOKEN"] = self.access_token
            
            # Set token expiry (typically 1 day)
            self.token_expiry = datetime.now() + timedelta(days=1)
            
            return True
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error generating session: {e}")
            return False
    
    def generate_checksum(self, request_token):
        """
        Generate checksum for API authentication
        
        In a real implementation, this would use SHA256 HMAC
        """
        import hashlib
        import hmac
        
        message = f"{self.api_key}{request_token}{self.api_secret}"
        return hmac.new(
            self.api_secret.encode(),
            message.encode(),
            hashlib.sha256
        ).hexdigest()
    
    def check_token_validity(self):
        """Check if the access token is still valid"""
        return datetime.now() < self.token_expiry
    
    def place_order(self, instrument, transaction_type, quantity, price=None, order_type="LIMIT"):
        """
        Place an order on Zerodha
        
        Args:
            instrument (str): Trading symbol (e.g., "RELIANCE", "NIFTY25JANFUT")
            transaction_type (str): "BUY" or "SELL"
            quantity (int): Number of shares or contracts
            price (float, optional): Order price (required for LIMIT orders)
            order_type (str, optional): "MARKET" or "LIMIT"
            
        Returns:
            dict: Order response with order_id if successful
        """
        if not self.check_token_validity():
            logger.error("Access token expired. Please re-authenticate.")
            return {"status": "error", "message": "Access token expired"}
        
        try:
            url = f"{self.base_url}/orders/regular"
            
            data = {
                "tradingsymbol": instrument,
                "exchange": "NSE",  # This would be dynamic in real implementation
                "transaction_type": transaction_type,
                "quantity": quantity,
                "product": "CNC",  # For intraday, this would be "MIS"
                "order_type": order_type,
            }
            
            # Add price for LIMIT orders
            if order_type == "LIMIT" and price:
                data["price"] = price
            
            response = self.session.post(url, data=data)
            response.raise_for_status()
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error placing order: {e}")
            return {"status": "error", "message": str(e)}
    
    def modify_order(self, order_id, price=None, quantity=None, order_type=None):
        """
        Modify an existing order
        
        Args:
            order_id (str): Order ID to be modified
            price (float, optional): New price
            quantity (int, optional): New quantity
            order_type (str, optional): New order type
            
        Returns:
            dict: Order response
        """
        if not self.check_token_validity():
            logger.error("Access token expired. Please re-authenticate.")
            return {"status": "error", "message": "Access token expired"}
        
        try:
            url = f"{self.base_url}/orders/{order_id}"
            
            data = {}
            if price:
                data["price"] = price
            if quantity:
                data["quantity"] = quantity
            if order_type:
                data["order_type"] = order_type
            
            response = self.session.put(url, data=data)
            response.raise_for_status()
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error modifying order: {e}")
            return {"status": "error", "message": str(e)}
    
    def cancel_order(self, order_id):
        """
        Cancel an order
        
        Args:
            order_id (str): Order ID to be cancelled
            
        Returns:
            dict: Response
        """
        if not self.check_token_validity():
            logger.error("Access token expired. Please re-authenticate.")
            return {"status": "error", "message": "Access token expired"}
        
        try:
            url = f"{self.base_url}/orders/{order_id}"
            
            response = self.session.delete(url)
            response.raise_for_status()
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error cancelling order: {e}")
            return {"status": "error", "message": str(e)}
    
    def get_orders(self):
        """Get all orders"""
        if not self.check_token_validity():
            logger.error("Access token expired. Please re-authenticate.")
            return {"status": "error", "message": "Access token expired"}
        
        try:
            url = f"{self.base_url}/orders"
            
            response = self.session.get(url)
            response.raise_for_status()
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching orders: {e}")
            return {"status": "error", "message": str(e)}
    
    def get_positions(self):
        """Get user positions"""
        if not self.check_token_validity():
            logger.error("Access token expired. Please re-authenticate.")
            return {"status": "error", "message": "Access token expired"}
        
        try:
            url = f"{self.base_url}/portfolio/positions"
            
            response = self.session.get(url)
            response.raise_for_status()
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching positions: {e}")
            return {"status": "error", "message": str(e)}
    
    def get_quote(self, instruments):
        """
        Get market quotes
        
        Args:
            instruments (list): List of instruments
            
        Returns:
            dict: Market quotes
        """
        if not self.check_token_validity():
            logger.error("Access token expired. Please re-authenticate.")
            return {"status": "error", "message": "Access token expired"}
        
        try:
            url = f"{self.base_url}/quote"
            
            # Format instruments as i=NSE:RELIANCE&i=NSE:INFY
            params = []
            for instrument in instruments:
                params.append(f"i=NSE:{instrument}")
            
            response = self.session.get(f"{url}?{'&'.join(params)}")
            response.raise_for_status()
            
            return response.json()
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching quotes: {e}")
            return {"status": "error", "message": str(e)}

# Example usage
if __name__ == "__main__":
    kite = KiteAPI()
    login_url = kite.login()
    print(f"Please visit this URL to login: {login_url}")