from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query, WebSocket, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, time
from passlib.context import CryptContext
import jwt
from fastapi import Response
from fastapi import Cookie
from fastapi.encoders import jsonable_encoder


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


# mongodb+srv://ahmad812002_db_user:<db_password>@dana.51p0ug4.mongodb.net/

# MongoDB


import os

mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME")

print("ENV CHECK")
print("MONGO_URL:", repr(os.environ.get("MONGO_URL")))
print("DB_NAME:", repr(os.environ.get("DB_NAME")))

if not mongo_url:
    raise RuntimeError("MONGO_URL is not set")
if not db_name:
    raise RuntimeError("DB_NAME is not set")


client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

print("MONGO_URL:", mongo_url)
print("DB_NAME:", db_name)


# JWT + Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get("JWT_SECRET", "vperfumes-secret-key-2025")
ALGORITHM = "HS256"
# security = HTTPBearer()

# FastAPI App
app = FastAPI()
api_router = APIRouter(prefix="/api")


# WebSocke
ws_router = APIRouter()


company_clients: dict[str, list[WebSocket]] = {}
@ws_router.websocket("/ws/orders/{company_id}")
async def ws_orders(websocket: WebSocket, company_id: str):
    
    print("WS attempt for:", company_id)
    await websocket.accept()
    print("WS accepted:", company_id)

    if company_id not in company_clients:
        company_clients[company_id] = []
    company_clients[company_id].append(websocket)
    try:
        while True:
            await websocket.receive()

    except Exception:
        pass

    finally:
        if company_id in company_clients and websocket in company_clients[company_id]:
            print("WS CLOSED:", company_id)
            company_clients.get(company_id, []).remove(websocket)
        if company_id in company_clients and not company_clients[company_id]:
            del company_clients[company_id]
        
        

app.include_router(ws_router)


@app.get("/api")
async def get_data():
    return {"message": "Hello from the backend!"}



print("Connecting to Mongo...")
try:
    client.admin.command("ping")
    print("MongoDB Connected!")
except Exception as e:
    print("MongoDB Error:", e)



class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    password_hash: str
    role: str  # "admin" or "company"
    company_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    company_id: Optional[int] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore", from_attributes=True)
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_name: str
    customer_phone: str
    delivery_area: str
    order_price: Optional[float] = 0.0  # Made optional for backward compatibility
    delivery_cost: float
    status: str  # "جاري" or "تم" or "ملغي"
    order_date: str
    notes: Optional[str] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    order_number: str
    customer_name: str
    customer_phone: str
    delivery_area: str
    order_price: Optional[float] = 0.0
    delivery_cost: float
    status: str
    order_date: str
    notes: Optional[str] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None

class OrderUpdate(BaseModel):
    order_number: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    delivery_area: Optional[str] = None
    order_price: Optional[float] = None
    delivery_cost: Optional[float] = None
    status: Optional[str] = None
    order_date: Optional[str] = None
    notes: Optional[str] = None

class OrderHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    action: str  # "created" or "updated"
    changes: dict
    user_id: str
    username: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Company(BaseModel): 
    company_name: str
    username: str
    password_hash: str

# ============= Helper Functions =============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
#     token = credentials.credentials
#     try:
#         payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
#         user_id = payload.get("sub")
#         if user_id is None:
#             raise HTTPException(status_code=401, detail="Invalid token")
        
#         user = await db.users.find_one({"id": user_id}, {"_id": 0})
#         if user is None:
#             raise HTTPException(status_code=401, detail="User not found")
        
#         return user
#     except jwt.ExpiredSignatureError:
#         raise HTTPException(status_code=401, detail="Token expired")
#     except jwt.JWTError:
#         raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(access_token: str | None = Cookie(default=None, alias="access_token")):
    print("Cookie Received:", access_token)
    
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id :
            raise HTTPException(status_code=401, detail="Invalid token")
        
        current_user = await db.users.find_one({"id": user_id}, {"_id": 0})

        if not current_user :
            raise HTTPException(status_code=401, detail="User not found")
        
        return  current_user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    

# ============= Routes =============

@api_router.get("/")
async def root():
    return {"message": "VPerfumes Order Tracking API"}

# Auth Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate, current_user: dict = Depends(get_current_user)):
    # Only admin can create new users
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create users")
    
    # Check if username exists
    existing_user = await db.users.find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create user
    user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        company_name=user_data.company_name
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    
    return {"message": "User created successfully", "username": user.username}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user["id"], "role": user["role"]})

    # local development
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,      
        samesite="lax",    
    )

    # https
    # response.set_cookie(
    #     key="access_token",
    #     value=token,
    #     httponly=True,
    #     secure=True,          # REQUIRED
    #     samesite="none",      # REQUIRED
    # )
    
    return {
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "company_name": user.get("company_name")
        }
    }

@api_router.post("/auth/logout")
async def logout(response: Response):
    print("delete")
    response.delete_cookie("access_token")
    return {"message": "Logged out"}

@api_router.get("/user")
async def get_user(current_user: dict = Depends(get_current_user)):
    
    return {
        "user":{
            "id": current_user["id"],
            "username": current_user["username"],
            "role": current_user["role"],
            "company_name": current_user.get("company_name")
        }
    }
    
@api_router.get("/users")
async def get_users():
    collection= db["users"]
    users_collection = collection.find({})
    users = []
    async for doc in users_collection:
        # stores mongodb primary key in new one called "id"
        doc["id"] = str(doc["_id"])
        # remove the original _id i have new one called "id"
        del doc["_id"]
        # push document into users list
        users.append(doc)
    return users 

@api_router.post("/auth/change-password")
async def change_password(password_data: PasswordChange, current_user: dict = Depends(get_current_user)):
    # Verify current password
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not user or not verify_password(password_data.current_password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="كلمة المرور الحالية غير صحيحة")
    
    # Update password
    new_hash = hash_password(password_data.new_password)
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"password_hash": new_hash}})
    
    return {"message": "تم تغيير كلمة المرور بنجاح"}

# Get order Routes
@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user: dict = Depends(get_current_user)):
    query = {}
    
    # If company user, only show their orders
    if current_user["role"] == "company":
        query["company_id"] = current_user["id"]
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(10000)
    
    # Convert ISO strings to datetime
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])

    
    # Sort by created_at descending
    orders.sort(key=lambda x: x['created_at'], reverse=True)
    
    return orders


# async def notify_company(company_id: str, new_order):
#     connections = company_clients.get(str(company_id))

#     if not connections:
#         return
    
#     payload = {
#         "event": "NEW_ORDER",
#         "company_id": company_id,
#         "message": "A new order has been created",
#         "order": jsonable_encoder(new_order)
#     }

#     dead_connections = []
#     for ws in connections:
#         try:
#             await ws.send_json(payload)
#         except:
#             dead_connections.append(ws)

#     for ws in dead_connections:
#         connections.remove(ws)
#     if not connections:
#         del company_clients[str(company_id)]


# Add order Routes
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    # Case 1: company adding an order
    if current_user["role"] == "company":
        company_id = current_user["id"]
        company_name = current_user["company_name"]

        
       

    # Case 2: admin adding an order
    else:
        company = await db.users.find_one({
            "company_name": order_data.company_name
        })

        # if company does not exist, raise a message telling that
        if not company:
            raise HTTPException(404, "Company not found")
        
        company_id = company["id"]
        company_name = company["company_name"]


    # Create order
    order = Order(
        **order_data.model_dump(exclude={"company_id", "company_name"}),
        company_id=company_id,
        company_name=company_name
    )
    doc = order.model_dump()
    doc['created_at'] = datetime.now(timezone.utc)
    doc['updated_at'] = datetime.now(timezone.utc)
                
    await db.orders.insert_one(doc)
                
    # Create history entry - clean doc for JSON serialization
    clean_doc = {k: v for k, v in doc.items() if k != '_id'}

    history = OrderHistory(
        order_id=order.id,
        action="created",
        changes=clean_doc,
        user_id=current_user["id"],
        username=current_user["username"]
    )
                
    history_doc = history.model_dump()
    history_doc['timestamp'] = history_doc['timestamp'].isoformat()
    await db.order_history.insert_one(history_doc)

    # Real-Time connection
    connections = company_clients.get(str(company_id), [])
    message = {
        "type": "new_order",
        "message": "You have a new order",
        "order": jsonable_encoder(clean_doc)
    }

    for ws in connections:
        try:
            await ws.send_json(message)
        except:
            pass
                
    return order
        
@api_router.get("/orders/report", response_model=List[Order])
async def get_report(
        date: str = Query(..., descritption="Date in YYYY-MM-DD format"),
        current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create report")
    collection= db["orders"]

    try:
        report_date = datetime.strptime(date, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    

    report_date = datetime.strptime(date, "%Y-%m-%d")

    start = datetime.combine(report_date, time.min).replace(tzinfo=timezone.utc)# 2025-11-19 00:00:00
    end = datetime.combine(report_date, time.max).replace(tzinfo=timezone.utc)# 2025-11-19 23:59:59.999999

    orders_cursor = collection.find({
        "status": {"$in": ["تم", "ملغي"]},  # حسب حالة الطلب
        "created_at": {"$gte": start, "$lte": end}  # فلتر حسب اليوم
    })

    orders = []

    async for doc in orders_cursor:
        # stores mongodb primary key in new one called "id"
        doc["id"] = str(doc["_id"])
        # remove the original _id i have new one called "id"
        del doc["_id"]
        # push document into users list
        orders.append(doc)
    return orders
                     
@api_router.put("/orders/{order_id}", response_model=Order)
async def update_order(order_id: str, order_data: OrderUpdate, current_user: dict = Depends(get_current_user)):
    # Find order
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    # Check permission
    if current_user["role"] == "company" and order["company_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لتعديل هذا الطلب")
    
    # Track changes
    changes = {}
    update_data = order_data.model_dump(exclude_unset=True)
    
    for key, new_value in update_data.items():
        if key in order and order[key] != new_value:
            changes[key] = {"old": order[key], "new": new_value}
    
    if not changes:
        return Order(**order)
    
    # Update order
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    # Create history entry
    history = OrderHistory(
        order_id=order_id,
        action="updated",
        changes=changes,
        user_id=current_user["id"],
        username=current_user["username"]
    )
    
    history_doc = history.model_dump()
    history_doc['timestamp'] = history_doc['timestamp'].isoformat()
    await db.order_history.insert_one(history_doc)

    # Real-Time connection
    # connections = admin_clients.get(str(admin_id), [])
    # message = {
    #     "type": "updated_order",
    #     "message": "You have a new order",
    #     "order": jsonable_encoder(update_data)
    # }

    # for ws in connections:
    #     try:
    #         await ws.send_json(message)
    #     except:
    #         pass
    
    # Get updated order
    updated_order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if isinstance(updated_order['created_at'], str):
        updated_order['created_at'] = datetime.fromisoformat(updated_order['created_at'])
    if isinstance(updated_order['updated_at'], str):
        updated_order['updated_at'] = datetime.fromisoformat(updated_order['updated_at'])
    
    return Order(**updated_order)

@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="الطلب غير موجود")
    
    # Check permission
    if current_user["role"] == "company" and order["company_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="ليس لديك صلاحية لحذف هذا الطلب")
    
    await db.orders.delete_one({"id": order_id})
    
    # Create history entry - clean order data for JSON serialization
    clean_order = {k: v for k, v in order.items() if k != '_id'}
    history = OrderHistory(
        order_id=order_id,
        action="deleted",
        changes={"order": clean_order},
        user_id=current_user["id"],
        username=current_user["username"]
    )
    
    history_doc = history.model_dump()
    history_doc['timestamp'] = history_doc['timestamp'].isoformat()
    await db.order_history.insert_one(history_doc)
    
    return {"message": "تم حذف الطلب بنجاح"}

@api_router.get("/orders/{order_id}/history", response_model=List[OrderHistory])
async def get_order_history(order_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    history = await db.order_history.find({"order_id": order_id}, {"_id": 0}).to_list(1000)
    
    # Convert ISO strings to datetime and ensure no ObjectId fields
    for entry in history:
        if isinstance(entry['timestamp'], str):
            entry['timestamp'] = datetime.fromisoformat(entry['timestamp'])
        # Remove any potential ObjectId fields that might have slipped through
        entry.pop('_id', None)
    
    history.sort(key=lambda x: x['timestamp'], reverse=True)
    
    return history

@api_router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    query = {}
    if current_user["role"] == "company":
        query["company_id"] = current_user["id"]
    
    total = await db.orders.count_documents(query)
    ongoing = await db.orders.count_documents({**query, "status": "جاري"})
    completed = await db.orders.count_documents({**query, "status": "تم"})
    cancelled = await db.orders.count_documents({**query, "status": "ملغي"})
    
    return {
        "total": total,
        "ongoing": ongoing,
        "completed": completed,
        "cancelled": cancelled
    }

# Company Management Routes (Admin only)
@api_router.get("/companies")
async def get_companies(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    companies = await db.users.find({"role": "company"}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    # Convert ISO strings to datetime
    for company in companies:
        if isinstance(company.get('created_at'), str):
            company['created_at'] = datetime.fromisoformat(company['created_at'])
    
    return companies

@api_router.delete("/companies/{company_id}")
async def delete_company(company_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find company
    company = await db.users.find_one({"id": company_id, "role": "company"})
    if not company:
        raise HTTPException(status_code=404, detail="الشركة غير موجودة")
    
    # Only delete company user account (keep orders for archive)
    await db.users.delete_one({"id": company_id})
    
    return {"message": f"تم حذف حساب شركة {company['company_name']} بنجاح. الطلبات محفوظة في الأرشيف"}

@api_router.post("/companies/{company_id}/reset-password")
async def reset_company_password(company_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Find company
    company = await db.users.find_one({"id": company_id, "role": "company"})
    if not company:
        raise HTTPException(status_code=404, detail="الشركة غير موجودة")
    
    # Generate new random password
    import secrets
    import string
    new_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(10))
    
    # Update password
    new_hash = hash_password(new_password)
    await db.users.update_one({"id": company_id}, {"$set": {"password_hash": new_hash}})
    
    return {
        "message": f"تم إعادة تعيين كلمة المرور لشركة {company['company_name']}",
        "company_name": company['company_name'],
        "username": company['username'],
        "new_password": new_password
    }

# @api_router.post("/add_company")
# async def add_company(company_name: str, user_name: str, password: str):
#     company = Company(
#         company_name = company_name,
#         user_name = user_name,
#         password = password)
#     doc = company.model_dump()
#     await db.companies.insert_one(doc)

origins = [
    "http://192.168.0.110:3000",  # your frontend origin
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # cannot be "*"
    allow_credentials=True,  # required to send cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(api_router)

# app.add_middleware(
#     CORSMiddleware,
#     allow_credentials=True,
#     allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
#     allow_methods=["*"],
#     allow_headers=["*"],
    
# )



logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Create default admin on startup
# @app.on_event("startup")
# async def create_default_admin():
#     admin_exists = await db.users.find_one({"role": "admin"})
#     if not admin_exists:
#         admin_password = "admin123"  # any simple admin password
#         admin = User(
#             username="admin",
#             password_hash=hash_password(admin_password),
#             role="admin",
#             company_name=None
#         )
#         doc = admin.model_dump()
#         doc['created_at'] = doc['created_at'].isoformat()
#         await db.users.insert_one(doc)
#         logger.info("Default admin created: username=admin, password=admin123")

# creating a company
# @app.on_event("startup")
# async def create_default_company():
#     company_exists = await db.users.find_one({"role": "company"})
#     if not company_exists:
#         company_password = "company123"  # any simple admin password
#         company = User(
#             username="ahmad",
#             password_hash=hash_password(company_password),
#             role="company",
#             company_name="ahmad's company"
#         )
#         doc = company.model_dump()
#         doc['created_at'] = doc['created_at'].isoformat()
#         await db.users.insert_one(doc)
#         logger.info("Default admin created: username=ahmad, password=company123")

