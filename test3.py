'''import pandas as pd
import numpy as np
import time
import random
from sklearn.linear_model import Lasso

# === File Paths ===
PRICING_CSV = "converted_prices_cleaned_fixed.csv"  # Competitor data
DEMAND_CSV = "demand_scores.csv"  # Precomputed demand scores

# === Load Data ===
df = pd.read_csv(PRICING_CSV, encoding="ISO-8859-1")
df["Unit Price"] = pd.to_numeric(df["Unit Price"], errors="coerce")
df["ratings"] = pd.to_numeric(df["ratings"], errors="coerce").fillna(0)

# === Load Demand Scores ===
try:
    demand_df = pd.read_csv(DEMAND_CSV)
    demand_dict = dict(zip(demand_df["Product Name"], demand_df["Demand Score"]))
except FileNotFoundError:
    print("⚠️ No demand score file found. Assigning default demand score 1.")
    demand_dict = {}

# === Hyperparameters ===
ALPHA_LASSO = 0.01  # Regularization for Lasso
MIN_PROFIT_MARGIN = 0.15  # Minimum 15% profit margin
MIN_DEMAND = 0  # Minimum raw demand score (before scaling)
MAX_DEMAND = 100  # Maximum raw demand score (before scaling)

# === Online Lasso Function ===
def online_lasso(X, y, alpha=ALPHA_LASSO):
    model = Lasso(alpha=alpha, max_iter=1000)
    model.fit(X, y)
    return model.coef_

# === Logarithmic Price Scaling ===
def compute_price_score(user_price, avg_price):
    if avg_price == 0 or user_price == 0:
        return 3  # Neutral Score
    ratio = user_price / avg_price
    return round(max(1, min(5, 3 + np.log2(ratio))), 2)

# === Normalize Demand Score to 1-5 Range ===
def normalize_demand_score(raw_demand):
    """Scales demand score to 1-5 range to avoid extreme price variations."""
    return round(1 + (raw_demand - MIN_DEMAND) / (MAX_DEMAND - MIN_DEMAND) * (5 - 1), 2)

# === Ensure Profit Margin ===
def enforce_profit_margin(suggested_price, cost_price, min_margin=MIN_PROFIT_MARGIN):
    min_price = cost_price * (1 + min_margin)  # Ensure 15% profit margin
    return max(suggested_price, min_price)

# === Market Value Calculation ===
def compute_market_value(price_score, rating_score, demand_score, avg_price, weights, X, y):
    price_weight, rating_weight, demand_weight = weights
    total_weight = price_weight + rating_weight + demand_weight
    price_weight /= total_weight
    rating_weight /= total_weight
    demand_weight /= total_weight

    demand_coeff = online_lasso(X, y)
    adjusted_market_price = avg_price * (price_score * price_weight +
                                         rating_score * rating_weight +
                                         demand_score * demand_weight) / 5
    return round(adjusted_market_price * (1 + np.mean(demand_coeff)), 2)

# === Pricing Execution ===
for index, row in df.iterrows():
    selected_category = row["Product Category"]
    selected_product = row["Product Name"]
    user_price = row["Unit Price"]
    user_rating = row["ratings"]
    cost_price = user_price * 0.85  # Assume cost is 85% of base price

    # Fetch raw demand score from CSV and normalize it
    raw_demand_score = demand_dict.get(selected_product, 0)  # Default to 0 if not found
    demand_score = normalize_demand_score(raw_demand_score)  # Scale demand score to 1-5

    # Compute avg price and rating from competitors
    competitor_data = df[(df["Product Category"] == selected_category) & (df["Product Name"] == selected_product)]
    avg_price = competitor_data["Unit Price"].mean() if not competitor_data.empty else user_price
    avg_rating = competitor_data["ratings"].mean() if not competitor_data.empty else user_rating

    price_score = compute_price_score(user_price, avg_price)
    rating_score = max(1, min(5, user_rating))

    # Prepare features for Lasso regression
    X = competitor_data[["Unit Price", "ratings"]].values if not competitor_data.empty else np.array([[user_price, user_rating]])
    y = competitor_data["Unit Price"].values if not competitor_data.empty else np.array([user_price])

    # Compute Market Value and Enforce Minimum Profit
    market_value = compute_market_value(price_score, rating_score, demand_score, avg_price, [0.7, 0.2, 0.1], X, y)
    final_price = enforce_profit_margin(market_value, cost_price)

    print(f"\n Demand & Market Analysis for {selected_product} ({selected_category})")
    print(f"Avg Competitor Price: {avg_price:.2f} | Your Price: {user_price:.2f} | Price Score: {price_score:.2f}")
    print(f"Avg Competitor Rating: {avg_rating:.2f} | Your Rating: {user_rating:.2f} | Rating Score: {rating_score:.2f}")
    print(f"Final Demand Score: {demand_score:.2f}")  # ✅ Now scaled between 1-5
    print(f"Suggested Market Price: {market_value:.2f} | Final Price with Margin: {final_price:.2f}")

    # Prevent rapid execution (optional delay)
    time.sleep(random.uniform(1, 2))  # Wait 1-2 seconds before processing next product
'''

from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.linear_model import Lasso

# === MongoDB Connection ===
client = MongoClient("mongodb+srv://vinuu53:6Os7IJR0UZ9WF9wj@cluster0.jk7ec.mongodb.net/")
db = client["dynamic_pricing"]
users_col = db["user"]
products_col = db["product"]

# === Load Demand Scores ===
demand_df = pd.read_csv("demand_scores.csv")
demand_dict = dict(zip(demand_df["Product Name"], demand_df["Demand Score"]))

# === Hyperparameters ===
ALPHA_LASSO = 0.01
MIN_PROFIT_MARGIN = 0.15

# === Online Lasso Function ===
def online_lasso(X, y, alpha=ALPHA_LASSO):
    model = Lasso(alpha=alpha, max_iter=1000)
    model.fit(X, y)
    return model.coef_

# === Normalize Demand Score ===
def normalize_demand_score(raw_demand):
    return round(1 + (raw_demand / 100) * 4, 2)

# === Price Score Computation ===
def compute_price_score(user_price, avg_price):
    return round(max(1, min(5, 3 + np.log2(user_price / avg_price))), 2) if avg_price > 0 else 3

# === Enforce Profit Margin ===
def enforce_profit_margin(suggested_price, cost_price):
    min_price = cost_price * (1 + MIN_PROFIT_MARGIN)
    return max(suggested_price, min_price)

# === Fetch User Dashboard Data ===
def fetch_user_data(user_id):
    user = users_col.find_one({"user_id": user_id})
    if not user or "dashboard" not in user:
        return None
    return user

def fetch_competitor_data(product_name, category):
    competitors = list(products_col.find({
        "category": category,
        "products.product_name": product_name
    }, {"products": 1}))  # Fetch only matching product entry

    competitor_list = []
    for competitor in competitors:
        for product in competitor.get("products", []):
            if product.get("product_name") == product_name:
                competitor_list.append(product)

    return competitor_list


def normalize_value(value, min_val, max_val):
    """Normalize a value to the range [0,5]."""
    if max_val == min_val:
        return 2.5  # Default neutral value if no variation
    return 5 * (value - min_val) / (max_val - min_val)

def calculate_dynamic_price(user_id):
    user_data = fetch_user_data(user_id)
    if not user_data:
        return "User data not found."

    dashboard_entry = user_data["dashboard"][0]
    product_name = dashboard_entry["product"]
    user_price = dashboard_entry["io_cost"]
    user_rating = dashboard_entry["io_rating"]

    # Fetch category
    user_product = products_col.find_one({"products.product_name": product_name}, {"category": 1})
    if not user_product or "category" not in user_product:
        return "Category not found."

    category = user_product["category"]

    # Fetch competitors
    competitors = fetch_competitor_data(product_name, category)
    if not competitors:
        return "Competitor data not found."

    df = pd.DataFrame(competitors)

    # Handle missing data safely
    competitor_prices = df["product_costs"].apply(lambda x: x[0] if x else user_price).values
    competitor_ratings = df["ratings"].apply(lambda x: x[0] if x else user_rating).values

    avg_price = np.mean(competitor_prices) if len(competitor_prices) > 0 else user_price
    avg_rating = np.mean(competitor_ratings) if len(competitor_ratings) > 0 else user_rating

    # Normalize values to [0,5]
    price_score = normalize_value(user_price, min(competitor_prices), max(competitor_prices))
    rating_score = normalize_value(user_rating, min(competitor_ratings), max(competitor_ratings))

    # Demand Score
    raw_demand_score = demand_dict.get(user_data["user_name"], 0)
    demand_score = normalize_value(raw_demand_score, 0, 100)  # Assuming demand score range is 0-100

    # Debug Prints
    print(f"User Price: {user_price}")
    print(f"Competitor Average Price: {avg_price}")
    print(f"User Rating: {user_rating}")
    print(f"Competitor Average Rating: {avg_rating}")
    print(f"Normalized Price Score: {price_score}")
    print(f"Normalized Rating Score: {rating_score}")
    print(f"Normalized Demand Score: {demand_score}")

    # Compute Market Value
    market_value = avg_price * (0.7 * price_score + 0.2 * rating_score + 0.1 * demand_score) / 5
    suggested_price = market_value

    # Ensure Profit Margin
    final_price = max(suggested_price, user_price * 0.85)

    # Update MongoDB
    users_col.update_one({"user_id": user_id}, {"$set": {"dashboard.0.suggested_price": final_price}})

    return {
        "user_price": user_price,
        "competitor_avg_price": avg_price,
        "suggested_price": final_price,
        "demand_score": demand_score
    }

# === Example Usage ===
user_id = "J6wK3EQ61QVqa5HHCfJ2Ca0bPV33"
pricing_result = calculate_dynamic_price(user_id)
print(pricing_result)
