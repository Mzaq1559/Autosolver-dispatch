# 美团配送调度系统数据库设计

本文档整理了美团配送调度系统的核心数据表结构，并根据当前设计补充了外键策略、状态约束、索引优化和扩展字段建议，便于后续开发、调度优化与数据分析。

## 一、核心实体

系统当前包含以下核心实体：

- `users`：用户
- `drivers`：骑手
- `restaurants`：商家
- `orders`：订单
- `order_items`：订单明细
- `driver_locations_history`：骑手历史轨迹
- `traffic_snapshots`：交通快照
- `payments`：支付记录
- `notifications`：消息通知
- `delivery_sla_rules`：配送时效 SLA 规则
- `driver_shifts`：骑手排班
- `coupons`：优惠券 / 营销活动
- `restaurant_business_hours`：商家营业时间
- `order_status_logs`：订单状态流转日志
- `user_coupons`：用户领券记录
- `products`：商家菜品
- `dispatch_tasks`：调度任务
- `rider_performance_stats`：骑手绩效统计
- `abnormal_orders`：异常订单处理
- `rider_rewards_penalties`：骑手奖惩记录
- `merchant_settlements`：商家结算
- `reviews`：用户评价
- `refund_records`：退款记录
- `dispatch_rule_configs`：调度规则配置
- `user_addresses`：用户地址
- `restaurant_categories`：商家分类
- `invoice_records`：发票记录
- `appeal_tickets`：申诉工单
- `risk_control_logs`：风控记录

---

## 二、表结构设计

### 1. 用户表 `users`

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY, -- 用户 ID
    name VARCHAR(100) NOT NULL, -- 用户姓名
    phone VARCHAR(20) UNIQUE NOT NULL, -- 手机号
    email VARCHAR(255) UNIQUE, -- 邮箱
    password_hash TEXT NOT NULL, -- 密码哈希
    default_address TEXT, -- 默认地址
    latitude DECIMAL(9,6), -- 默认纬度
    longitude DECIMAL(9,6), -- 默认经度
    vip_level VARCHAR(20) DEFAULT 'normal', -- 会员等级
    loyalty_points INTEGER DEFAULT 0, -- 积分
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    CHECK (vip_level IN ('normal', 'silver', 'gold', 'platinum'))
);
```

说明：
- 记录用户基础信息、地址和会员属性。

### 2. 骑手表 `drivers`

```sql
CREATE TABLE drivers (
    id UUID PRIMARY KEY, -- 骑手 ID
    name VARCHAR(100) NOT NULL, -- 骑手姓名
    phone VARCHAR(20) UNIQUE NOT NULL, -- 手机号
    vehicle_type VARCHAR(50) NOT NULL, -- 车辆类型
    status VARCHAR(20) NOT NULL DEFAULT 'offline', -- 当前状态
    current_latitude DECIMAL(9,6), -- 当前纬度
    current_longitude DECIMAL(9,6), -- 当前经度
    rating FLOAT DEFAULT 5.0, -- 评分
    total_deliveries INTEGER DEFAULT 0, -- 总配送单量
    last_heartbeat_at TIMESTAMP, -- 最后在线时间
    last_assigned_order_id UUID, -- 最近派单 ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    CHECK (status IN ('offline', 'idle', 'busy', 'suspended'))
);
```

说明：
- 记录骑手状态、位置和运力相关信息。

### 3. 商家表 `restaurants`

```sql
CREATE TABLE restaurants (
    id UUID PRIMARY KEY, -- 商家 ID
    name VARCHAR(255) NOT NULL, -- 商家名称
    address TEXT NOT NULL, -- 商家地址
    latitude DECIMAL(9,6), -- 纬度
    longitude DECIMAL(9,6), -- 经度
    phone VARCHAR(20), -- 联系电话
    is_active BOOLEAN DEFAULT TRUE, -- 是否营业
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);
```

说明：
- 记录商家基础信息和地理位置。

### 4. 订单表 `orders`

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY, -- 订单 ID
    user_id UUID, -- 用户 ID
    driver_id UUID, -- 骑手 ID
    restaurant_id UUID NOT NULL, -- 商家 ID
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- 订单状态
    pickup_latitude DECIMAL(9,6), -- 取餐点纬度
    pickup_longitude DECIMAL(9,6), -- 取餐点经度
    delivery_latitude DECIMAL(9,6), -- 配送点纬度
    delivery_longitude DECIMAL(9,6), -- 配送点经度
    total_price DECIMAL(10,2) NOT NULL, -- 订单金额
    estimated_delivery_time INTEGER, -- 预计送达时长（分钟）
    priority_score FLOAT DEFAULT 0, -- 调度优先级
    route_distance_km NUMERIC(6,2), -- 配送距离（公里）
    traffic_delay_minutes INTEGER, -- 交通延迟（分钟）
    cancellation_reason TEXT, -- 取消原因
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    assigned_at TIMESTAMP, -- 派单时间
    delivered_at TIMESTAMP, -- 送达时间

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_orders_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_orders_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CHECK (status IN (
        'pending',
        'paid',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'assigned',
        'picked_up',
        'delivering',
        'completed',
        'cancelled'
    ))
);
```

说明：
- 记录订单状态、配送位置和履约过程信息。

### 5. 订单明细表 `order_items`

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY, -- 明细 ID
    order_id UUID NOT NULL, -- 订单 ID
    product_name VARCHAR(255) NOT NULL, -- 商品名称
    quantity INTEGER NOT NULL DEFAULT 1, -- 数量
    unit_price DECIMAL(10,2) NOT NULL, -- 单价
    total_price DECIMAL(10,2) NOT NULL, -- 小计金额
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_order_items_order-- 外键约束
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

说明：
- 记录订单内的商品明细。

### 6. 骑手历史轨迹表 `driver_locations_history`

```sql
CREATE TABLE driver_locations_history (
    id UUID PRIMARY KEY, -- 轨迹 ID
    driver_id UUID NOT NULL, -- 骑手 ID
    latitude DECIMAL(9,6) NOT NULL, -- 纬度
    longitude DECIMAL(9,6) NOT NULL, -- 经度
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 记录时间

    CONSTRAINT fk_driver_locations_history_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

说明：
- 记录骑手历史位置轨迹。

### 7. 交通快照表 `traffic_snapshots`

```sql
CREATE TABLE traffic_snapshots (
    id UUID PRIMARY KEY, -- 快照 ID
    latitude DECIMAL(9,6) NOT NULL, -- 纬度
    longitude DECIMAL(9,6) NOT NULL, -- 经度
    traffic_level VARCHAR(20), -- 拥堵等级
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 记录时间
    CHECK (traffic_level IN ('low', 'medium', 'high', 'severe'))
);
```

说明：
- 记录指定位置的交通状态快照。

### 8. 支付记录表 `payments`

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY, -- 支付 ID
    order_id UUID, -- 订单 ID
    user_id UUID NOT NULL, -- 用户 ID
    amount DECIMAL(10,2) NOT NULL, -- 支付金额
    method VARCHAR(50) NOT NULL, -- 支付方式
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 支付状态
    paid_at TIMESTAMP, -- 支付时间

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_payments_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CHECK (method IN ('wechat', 'alipay', 'card', 'cash')),
    CHECK (status IN ('pending', 'paid', 'failed', 'refunded'))
);
```

说明：
- 记录订单支付流水和支付状态。

### 9. 通知表 `notifications`

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY, -- 通知 ID
    user_id UUID, -- 用户 ID
    driver_id UUID, -- 骑手 ID
    order_id UUID, -- 订单 ID
    type VARCHAR(50) NOT NULL, -- 通知类型
    content TEXT NOT NULL, -- 通知内容
    status VARCHAR(20) DEFAULT 'unread', -- 已读状态
    read_at TIMESTAMP, -- 已读时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_notifications_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_notifications_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CHECK (status IN ('unread', 'read'))
);
```

说明：
- 记录用户和骑手的消息通知。

### 10. 配送时效 SLA 表 `delivery_sla_rules`

```sql
CREATE TABLE delivery_sla_rules (
    id UUID PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL, -- SLA 规则名称
    city_name VARCHAR(100), -- 适用城市
    business_type VARCHAR(50), -- 业务类型：如外卖/跑腿
    distance_min_km NUMERIC(6,2), -- 最小配送距离（公里）
    distance_max_km NUMERIC(6,2), -- 最大配送距离（公里）
    expected_delivery_minutes INTEGER NOT NULL, -- 目标送达时长（分钟）
    warning_threshold_minutes INTEGER, -- 预警阈值（分钟）
    timeout_threshold_minutes INTEGER, -- 超时阈值（分钟）
    priority INTEGER DEFAULT 0, -- 规则优先级，值越大优先级越高
    is_active BOOLEAN DEFAULT TRUE, -- 是否启用
    effective_from TIMESTAMP, -- 生效开始时间
    effective_to TIMESTAMP, -- 生效结束时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

说明：
- 用于定义不同城市、距离、业务类型下的配送时效标准。
- 可作为 ETA 评估、超时判定和履约考核的基础规则表。

### 11. 骑手排班表 `driver_shifts`

```sql
CREATE TABLE driver_shifts (
    id UUID PRIMARY KEY,
    driver_id UUID NOT NULL, -- 骑手 ID
    shift_date DATE NOT NULL, -- 排班日期
    shift_type VARCHAR(30) NOT NULL, -- 班次类型：morning/afternoon/evening/night
    start_time TIMESTAMP NOT NULL, -- 上班时间
    end_time TIMESTAMP NOT NULL, -- 下班时间
    shift_status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled/checked_in/completed/absent/cancelled
    service_area VARCHAR(100), -- 服务片区
    max_order_capacity INTEGER DEFAULT 0, -- 班次最大接单量
    actual_check_in_at TIMESTAMP, -- 实际签到时间
    actual_check_out_at TIMESTAMP, -- 实际签退时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_driver_shifts_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (shift_type IN ('morning', 'afternoon', 'evening', 'night')),
    CHECK (shift_status IN ('scheduled', 'checked_in', 'completed', 'absent', 'cancelled'))
);
```

说明：
- 用于管理骑手排班、签到和运力预测。
- `service_area` 可与商圈、站点或网格区域联动。

### 12. 优惠券 / 营销活动表 `coupons`

```sql
CREATE TABLE coupons (
    id UUID PRIMARY KEY,
    coupon_name VARCHAR(100) NOT NULL, -- 优惠券名称
    coupon_type VARCHAR(30) NOT NULL, -- 满减券/折扣券/运费券
    discount_amount DECIMAL(10,2), -- 优惠金额
    discount_rate DECIMAL(5,2), -- 折扣比例，如 8.50 表示 8.5 折
    min_order_amount DECIMAL(10,2) DEFAULT 0, -- 最低消费门槛
    max_discount_amount DECIMAL(10,2), -- 最高优惠金额
    total_quantity INTEGER, -- 发放总量
    claimed_quantity INTEGER DEFAULT 0, -- 已领取数量
    used_quantity INTEGER DEFAULT 0, -- 已使用数量
    valid_from TIMESTAMP NOT NULL, -- 有效期开始时间
    valid_to TIMESTAMP NOT NULL, -- 有效期结束时间
    applicable_scope VARCHAR(30) DEFAULT 'platform', -- platform/restaurant/category
    restaurant_id UUID, -- 适用商家 ID
    is_active BOOLEAN DEFAULT TRUE, -- 是否生效
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_coupons_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CHECK (coupon_type IN ('full_reduction', 'discount', 'delivery_fee')),
    CHECK (applicable_scope IN ('platform', 'restaurant', 'category'))
);
```

说明：
- 用于支持平台券、商家券和品类券等营销场景。
- 若后续需要支持“用户领券”，可继续增加 `user_coupons` 关联表。

### 13. 商家营业时间表 `restaurant_business_hours`

```sql
CREATE TABLE restaurant_business_hours (
    id UUID PRIMARY KEY,
    restaurant_id UUID NOT NULL, -- 商家 ID
    day_of_week SMALLINT NOT NULL, -- 星期几：1-7
    open_time TIME NOT NULL, -- 营业开始时间
    close_time TIME NOT NULL, -- 营业结束时间
    is_open BOOLEAN DEFAULT TRUE, -- 当天是否营业
    delivery_start_time TIME, -- 外卖接单开始时间
    delivery_end_time TIME, -- 外卖接单结束时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_restaurant_business_hours_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (day_of_week BETWEEN 1 AND 7)
);
```

说明：
- 用于控制商家营业时段与外卖接单时段。
- 如果商家存在午休或夜宵双时段，后续可按同一 `restaurant_id + day_of_week` 维护多条记录。

### 14. 订单状态流转日志表 `order_status_logs`

```sql
CREATE TABLE order_status_logs (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL, -- 订单 ID
    from_status VARCHAR(30), -- 变更前状态
    to_status VARCHAR(30) NOT NULL, -- 变更后状态
    operator_type VARCHAR(20) NOT NULL, -- 操作方：system/user/driver/merchant/admin
    operator_id UUID, -- 操作人 ID
    change_reason TEXT, -- 状态变更原因
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 变更时间

    CONSTRAINT fk_order_status_logs_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (operator_type IN ('system', 'user', 'driver', 'merchant', 'admin'))
);
```

说明：
- 用于追踪订单从创建到完成或取消的完整状态流转过程。
- 适合支持审计、售后排查、履约分析与异常诊断。

### 15. 用户领券记录表 `user_coupons`

```sql
CREATE TABLE user_coupons (
    id UUID PRIMARY KEY, -- 记录 ID
    user_id UUID NOT NULL, -- 用户 ID
    coupon_id UUID NOT NULL, -- 优惠券 ID
    status VARCHAR(20) NOT NULL DEFAULT 'unused', -- 使用状态
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 领取时间
    used_at TIMESTAMP, -- 使用时间
    expired_at TIMESTAMP, -- 失效时间
    order_id UUID, -- 使用订单 ID

    CONSTRAINT fk_user_coupons_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_user_coupons_coupon
        FOREIGN KEY (coupon_id)
        REFERENCES coupons(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_user_coupons_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CHECK (status IN ('unused', 'used', 'expired', 'cancelled'))
);
```

说明：
- 记录用户领券、使用和失效情况。

### 16. 商家菜品表 `products`

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY, -- 菜品 ID
    restaurant_id UUID NOT NULL, -- 商家 ID
    name VARCHAR(255) NOT NULL, -- 菜品名称
    category VARCHAR(100), -- 菜品分类
    description TEXT, -- 菜品描述
    price DECIMAL(10,2) NOT NULL, -- 售价
    packaging_fee DECIMAL(10,2) DEFAULT 0, -- 打包费
    stock INTEGER DEFAULT 0, -- 库存
    is_available BOOLEAN DEFAULT TRUE, -- 是否上架
    image_url TEXT, -- 图片地址
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间

    CONSTRAINT fk_products_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

说明：
- 记录商家菜品、价格和库存信息。

### 17. 调度任务表 `dispatch_tasks`

```sql
CREATE TABLE dispatch_tasks (
    id UUID PRIMARY KEY, -- 调度任务 ID
    order_id UUID NOT NULL, -- 订单 ID
    driver_id UUID, -- 骑手 ID
    task_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 任务状态
    dispatch_strategy VARCHAR(50), -- 调度策略
    priority_score FLOAT DEFAULT 0, -- 优先级分数
    dispatch_round INTEGER DEFAULT 1, -- 调度轮次
    assigned_at TIMESTAMP, -- 分配时间
    accepted_at TIMESTAMP, -- 接单时间
    rejected_at TIMESTAMP, -- 拒单时间
    completed_at TIMESTAMP, -- 完成时间
    fail_reason TEXT, -- 失败原因
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_dispatch_tasks_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dispatch_tasks_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CHECK (task_status IN ('pending', 'assigned', 'accepted', 'rejected', 'expired', 'completed', 'failed'))
);
```

说明：
- 记录订单调度过程和派单结果。

### 18. 骑手绩效统计表 `rider_performance_stats`

```sql
CREATE TABLE rider_performance_stats (
    id UUID PRIMARY KEY, -- 统计 ID
    driver_id UUID NOT NULL, -- 骑手 ID
    stat_date DATE NOT NULL, -- 统计日期
    total_orders INTEGER DEFAULT 0, -- 总单量
    completed_orders INTEGER DEFAULT 0, -- 完成单量
    cancelled_orders INTEGER DEFAULT 0, -- 取消单量
    total_online_minutes INTEGER DEFAULT 0, -- 在线时长（分钟）
    total_delivery_minutes INTEGER DEFAULT 0, -- 配送时长（分钟）
    on_time_rate DECIMAL(5,2), -- 准时率
    rejection_rate DECIMAL(5,2), -- 拒单率
    average_rating DECIMAL(3,2), -- 平均评分
    income_amount DECIMAL(10,2) DEFAULT 0, -- 收入金额
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_rider_performance_stats_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

说明：
- 按日汇总骑手履约和收入表现。

### 19. 异常订单处理表 `abnormal_orders`

```sql
CREATE TABLE abnormal_orders (
    id UUID PRIMARY KEY, -- 异常记录 ID
    order_id UUID NOT NULL, -- 订单 ID
    abnormal_type VARCHAR(50) NOT NULL, -- 异常类型
    abnormal_status VARCHAR(20) NOT NULL DEFAULT 'open', -- 处理状态
    reported_by VARCHAR(20) NOT NULL, -- 上报方
    description TEXT, -- 异常描述
    resolution TEXT, -- 处理结果
    handled_by UUID, -- 处理人 ID
    reported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 上报时间
    handled_at TIMESTAMP, -- 处理时间

    CONSTRAINT fk_abnormal_orders_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (abnormal_status IN ('open', 'processing', 'resolved', 'closed')),
    CHECK (reported_by IN ('system', 'user', 'driver', 'merchant', 'admin'))
);
```

说明：
- 记录异常订单及其处理过程。

### 20. 骑手奖惩记录表 `rider_rewards_penalties`

```sql
CREATE TABLE rider_rewards_penalties (
    id UUID PRIMARY KEY, -- 记录 ID
    driver_id UUID NOT NULL, -- 骑手 ID，对应被奖惩的骑手
    order_id UUID, -- 关联订单 ID，若奖惩与具体订单有关则记录
    record_type VARCHAR(20) NOT NULL, -- 记录类型：reward 奖励 / penalty 处罚
    reason_type VARCHAR(50) NOT NULL, -- 原因类型：如准时送达、投诉、拒单、超时等
    reason_detail TEXT, -- 原因说明，补充具体奖惩背景
    score_delta INTEGER DEFAULT 0, -- 积分变动值，可正可负
    amount_delta DECIMAL(10,2) DEFAULT 0, -- 金额变动值，可正可负
    source_type VARCHAR(20) NOT NULL, -- 来源类型：system/admin/appeal
    source_id UUID, -- 来源记录 ID，如申诉单或运营处理单
    effective_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 生效时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_rider_rewards_penalties_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_rider_rewards_penalties_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CHECK (record_type IN ('reward', 'penalty')),
    CHECK (source_type IN ('system', 'admin', 'appeal'))
);
```

说明：
- 记录骑手奖励、处罚及对应原因。

### 21. 商家结算表 `merchant_settlements`

```sql
CREATE TABLE merchant_settlements (
    id UUID PRIMARY KEY, -- 结算单 ID
    restaurant_id UUID NOT NULL, -- 商家 ID，对应被结算的商家
    settlement_period_start DATE NOT NULL, -- 结算周期开始日期
    settlement_period_end DATE NOT NULL, -- 结算周期结束日期
    total_order_amount DECIMAL(12,2) DEFAULT 0, -- 周期内订单总金额
    commission_amount DECIMAL(12,2) DEFAULT 0, -- 平台佣金金额
    delivery_service_fee DECIMAL(12,2) DEFAULT 0, -- 配送服务费
    marketing_subsidy_amount DECIMAL(12,2) DEFAULT 0, -- 营销补贴金额
    refund_deduction_amount DECIMAL(12,2) DEFAULT 0, -- 退款扣减金额
    adjustment_amount DECIMAL(12,2) DEFAULT 0, -- 人工调整金额，可正可负
    settlement_amount DECIMAL(12,2) NOT NULL, -- 实际结算金额
    settlement_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 结算状态
    settled_at TIMESTAMP, -- 实际结算时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_merchant_settlements_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (settlement_status IN ('pending', 'processing', 'settled', 'failed', 'cancelled'))
);
```

说明：
- 记录商家周期结算金额和结算状态。

### 22. 用户评价表 `reviews`

```sql
CREATE TABLE reviews (
    id UUID PRIMARY KEY, -- 评价 ID
    order_id UUID NOT NULL, -- 订单 ID，对应本次评价的订单
    user_id UUID NOT NULL, -- 用户 ID，评价发起人
    restaurant_id UUID NOT NULL, -- 商家 ID，被评价商家
    driver_id UUID, -- 骑手 ID，被评价骑手
    overall_rating DECIMAL(2,1) NOT NULL, -- 综合评分，如 4.5
    food_rating DECIMAL(2,1), -- 餐品评分
    delivery_rating DECIMAL(2,1), -- 配送评分
    service_rating DECIMAL(2,1), -- 服务评分
    content TEXT, -- 评价内容
    has_images BOOLEAN DEFAULT FALSE, -- 是否带图
    is_anonymous BOOLEAN DEFAULT FALSE, -- 是否匿名
    reply_content TEXT, -- 商家或平台回复内容
    replied_at TIMESTAMP, -- 回复时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_reviews_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_reviews_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_reviews_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
```

说明：
- 记录用户对商家和骑手的订单评价。

### 23. 退款记录表 `refund_records`

```sql
CREATE TABLE refund_records (
    id UUID PRIMARY KEY, -- 退款记录 ID
    order_id UUID NOT NULL, -- 订单 ID，对应退款所属订单
    payment_id UUID, -- 支付 ID，对应原始支付流水
    user_id UUID NOT NULL, -- 用户 ID，退款申请人
    refund_type VARCHAR(30) NOT NULL, -- 退款类型：全额/部分/运费退款等
    refund_reason TEXT, -- 退款原因，记录申请理由
    refund_amount DECIMAL(10,2) NOT NULL, -- 退款金额
    refund_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 退款状态
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 申请时间
    approved_at TIMESTAMP, -- 审核通过时间
    refunded_at TIMESTAMP, -- 实际退款时间
    processed_by UUID, -- 处理人 ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_refund_records_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_refund_records_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_refund_records_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (refund_type IN ('full', 'partial', 'delivery_fee')),
    CHECK (refund_status IN ('pending', 'approved', 'rejected', 'refunded', 'failed'))
);
```

说明：
- 记录订单退款申请、审核和到账过程。

### 24. 调度规则配置表 `dispatch_rule_configs`

```sql
CREATE TABLE dispatch_rule_configs (
    id UUID PRIMARY KEY, -- 规则 ID
    rule_name VARCHAR(100) NOT NULL, -- 规则名称，便于后台识别和管理
    city_name VARCHAR(100), -- 适用城市，为空表示全国通用
    service_area VARCHAR(100), -- 适用区域，如商圈、站点或网格
    business_type VARCHAR(50), -- 业务类型：外卖/跑腿等
    rule_type VARCHAR(50) NOT NULL, -- 规则类型：距离、优先级、运力、重派等
    trigger_condition TEXT, -- 触发条件描述，可记录规则表达式或文字说明
    rule_value JSON, -- 规则参数值，适合存储阈值和配置项
    priority INTEGER DEFAULT 0, -- 规则优先级，值越大越先执行
    is_active BOOLEAN DEFAULT TRUE, -- 是否启用
    effective_from TIMESTAMP, -- 生效开始时间
    effective_to TIMESTAMP, -- 生效结束时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 更新时间
);
```

说明：
- 记录调度引擎使用的业务规则和参数配置。

### 25. 用户地址表 `user_addresses`

```sql
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY, -- 地址 ID
    user_id UUID NOT NULL, -- 用户 ID，对应地址所属用户
    contact_name VARCHAR(100) NOT NULL, -- 联系人姓名，用于收货联系
    contact_phone VARCHAR(20) NOT NULL, -- 联系电话，用于配送联系
    province VARCHAR(100), -- 省份
    city VARCHAR(100), -- 城市
    district VARCHAR(100), -- 区县
    detail_address TEXT NOT NULL, -- 详细地址，精确到门牌号
    latitude DECIMAL(9,6), -- 地址纬度，用于定位和派单
    longitude DECIMAL(9,6), -- 地址经度，用于定位和派单
    tag VARCHAR(30), -- 地址标签：home/company/school 等
    is_default BOOLEAN DEFAULT FALSE, -- 是否为默认地址
    is_valid BOOLEAN DEFAULT TRUE, -- 地址是否有效
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间

    CONSTRAINT fk_user_addresses_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
```

说明：
- 记录用户常用收货地址和定位信息。

### 26. 商家分类表 `restaurant_categories`

```sql
CREATE TABLE restaurant_categories (
    id UUID PRIMARY KEY, -- 分类 ID
    restaurant_id UUID NOT NULL, -- 商家 ID，对应所属商家
    category_name VARCHAR(100) NOT NULL, -- 分类名称，如快餐、奶茶、烧烤
    category_type VARCHAR(30) DEFAULT 'business', -- 分类类型：business/tag/platform
    sort_order INTEGER DEFAULT 0, -- 排序值，值越小越靠前
    is_primary BOOLEAN DEFAULT FALSE, -- 是否主分类
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_restaurant_categories_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (category_type IN ('business', 'tag', 'platform'))
);
```

说明：
- 记录商家的经营分类和展示标签。

### 27. 发票记录表 `invoice_records`

```sql
CREATE TABLE invoice_records (
    id UUID PRIMARY KEY, -- 发票记录 ID
    order_id UUID NOT NULL, -- 订单 ID，对应申请开发票的订单
    user_id UUID NOT NULL, -- 用户 ID，发票申请人
    invoice_type VARCHAR(20) NOT NULL, -- 发票类型：personal/company
    invoice_title VARCHAR(255) NOT NULL, -- 发票抬头
    tax_number VARCHAR(50), -- 税号，企业发票时使用
    invoice_amount DECIMAL(10,2) NOT NULL, -- 开票金额
    invoice_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 开票状态
    email VARCHAR(255), -- 电子发票接收邮箱
    issued_at TIMESTAMP, -- 开票时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间

    CONSTRAINT fk_invoice_records_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_invoice_records_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (invoice_type IN ('personal', 'company')),
    CHECK (invoice_status IN ('pending', 'processing', 'issued', 'failed', 'cancelled'))
);
```

说明：
- 记录订单开票申请和开票结果。

### 28. 申诉工单表 `appeal_tickets`

```sql
CREATE TABLE appeal_tickets (
    id UUID PRIMARY KEY, -- 工单 ID
    order_id UUID, -- 订单 ID，若申诉与订单相关则记录
    user_id UUID, -- 用户 ID，用户发起申诉时记录
    driver_id UUID, -- 骑手 ID，骑手发起申诉时记录
    restaurant_id UUID, -- 商家 ID，商家发起申诉时记录
    ticket_type VARCHAR(30) NOT NULL, -- 工单类型：refund/penalty/review/complaint 等
    ticket_status VARCHAR(20) NOT NULL DEFAULT 'open', -- 工单状态
    title VARCHAR(255) NOT NULL, -- 工单标题
    content TEXT NOT NULL, -- 工单内容，描述申诉问题
    priority_level VARCHAR(20) DEFAULT 'medium', -- 优先级：low/medium/high/urgent
    assigned_to UUID, -- 处理人 ID
    resolution TEXT, -- 处理结果说明
    resolved_at TIMESTAMP, -- 处理完成时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间

    CONSTRAINT fk_appeal_tickets_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_appeal_tickets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_appeal_tickets_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_appeal_tickets_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CHECK (ticket_status IN ('open', 'processing', 'resolved', 'rejected', 'closed')),
    CHECK (priority_level IN ('low', 'medium', 'high', 'urgent'))
);
```

说明：
- 记录用户、骑手或商家的申诉处理流程。

### 29. 风控记录表 `risk_control_logs`

```sql
CREATE TABLE risk_control_logs (
    id UUID PRIMARY KEY, -- 风控记录 ID
    order_id UUID, -- 订单 ID，若风控命中订单则记录
    user_id UUID, -- 用户 ID，若风控命中用户则记录
    driver_id UUID, -- 骑手 ID，若风控命中骑手则记录
    restaurant_id UUID, -- 商家 ID，若风控命中商家则记录
    risk_type VARCHAR(50) NOT NULL, -- 风险类型：刷单、异常退款、异常定位等
    risk_level VARCHAR(20) NOT NULL, -- 风险等级：low/medium/high/critical
    risk_score DECIMAL(5,2), -- 风险分值，用于量化评估
    hit_rule_name VARCHAR(100), -- 命中的风控规则名称
    action_taken VARCHAR(50), -- 风控动作：warn/review/block/freeze 等
    action_result VARCHAR(20) DEFAULT 'pending', -- 动作结果
    remark TEXT, -- 备注说明，补充风险细节
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 识别时间
    processed_at TIMESTAMP, -- 处理时间

    CONSTRAINT fk_risk_control_logs_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_risk_control_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_risk_control_logs_driver
        FOREIGN KEY (driver_id)
        REFERENCES drivers(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_risk_control_logs_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    CHECK (action_result IN ('pending', 'approved', 'rejected', 'executed'))
);
```

说明：
- 记录风控命中结果、处理动作和处置状态。

---

## 三、索引建议

```sql
CREATE INDEX idx_orders_status
ON orders(status);

CREATE INDEX idx_orders_driver
ON orders(driver_id);

CREATE INDEX idx_orders_restaurant_status
ON orders(restaurant_id, status);

CREATE INDEX idx_order_status_logs_order_changed_at
ON order_status_logs(order_id, changed_at);

CREATE INDEX idx_drivers_status
ON drivers(status);

CREATE INDEX idx_drivers_location
ON drivers(current_latitude, current_longitude);

CREATE INDEX idx_drivers_location_status
ON drivers(current_latitude, current_longitude, status);

CREATE INDEX idx_driver_shifts_driver_date
ON driver_shifts(driver_id, shift_date);

CREATE INDEX idx_coupons_valid_time
ON coupons(valid_from, valid_to);

CREATE INDEX idx_restaurant_business_hours_restaurant_day
ON restaurant_business_hours(restaurant_id, day_of_week);

CREATE INDEX idx_user_coupons_user_status
ON user_coupons(user_id, status);

CREATE INDEX idx_products_restaurant_available
ON products(restaurant_id, is_available);

CREATE INDEX idx_dispatch_tasks_order_status
ON dispatch_tasks(order_id, task_status);

CREATE INDEX idx_rider_performance_stats_driver_date
ON rider_performance_stats(driver_id, stat_date);

CREATE INDEX idx_abnormal_orders_order_status
ON abnormal_orders(order_id, abnormal_status);

CREATE INDEX idx_rider_rewards_penalties_driver_effective
ON rider_rewards_penalties(driver_id, effective_at);

CREATE INDEX idx_merchant_settlements_restaurant_period
ON merchant_settlements(restaurant_id, settlement_period_start, settlement_period_end);

CREATE INDEX idx_reviews_restaurant_created_at
ON reviews(restaurant_id, created_at);

CREATE INDEX idx_refund_records_order_status
ON refund_records(order_id, refund_status);

CREATE INDEX idx_dispatch_rule_configs_scope_active
ON dispatch_rule_configs(city_name, service_area, is_active);

CREATE INDEX idx_user_addresses_user_default
ON user_addresses(user_id, is_default);

CREATE INDEX idx_restaurant_categories_restaurant_primary
ON restaurant_categories(restaurant_id, is_primary);

CREATE INDEX idx_invoice_records_order_status
ON invoice_records(order_id, invoice_status);

CREATE INDEX idx_appeal_tickets_order_status
ON appeal_tickets(order_id, ticket_status);

CREATE INDEX idx_risk_control_logs_order_level
ON risk_control_logs(order_id, risk_level);
```

说明：
- `orders(status)`：用于筛选待处理订单、已完成订单等。
- `orders(driver_id)`：用于查询骑手当前或历史配送订单。
- `orders(restaurant_id, status)`：适合查询商家待取餐、待派单订单。
- `drivers(status)`：适合快速筛选可接单骑手。
- `drivers(current_latitude, current_longitude)`：支持位置范围筛选。
- `drivers(current_latitude, current_longitude, status)`：适合实时派单场景下同时按位置和状态过滤。
- `order_status_logs(order_id, changed_at)`：适合查询订单状态变更历史。
- `driver_shifts(driver_id, shift_date)`：适合查询骑手某日班次。
- `coupons(valid_from, valid_to)`：适合筛选当前有效营销活动。
- `restaurant_business_hours(restaurant_id, day_of_week)`：适合查询商家某天营业安排。
- `user_coupons(user_id, status)`：适合查询用户可用优惠券。
- `products(restaurant_id, is_available)`：适合查询商家在售菜品。
- `dispatch_tasks(order_id, task_status)`：适合查询订单派单进度。
- `rider_performance_stats(driver_id, stat_date)`：适合查询骑手日绩效。
- `abnormal_orders(order_id, abnormal_status)`：适合查询订单异常处理状态。
- `rider_rewards_penalties(driver_id, effective_at)`：适合查询骑手奖惩记录。
- `merchant_settlements(restaurant_id, settlement_period_start, settlement_period_end)`：适合查询商家周期结算单。
- `reviews(restaurant_id, created_at)`：适合查询商家评价列表。
- `refund_records(order_id, refund_status)`：适合查询订单退款进度。
- `dispatch_rule_configs(city_name, service_area, is_active)`：适合筛选生效中的调度规则。
- `user_addresses(user_id, is_default)`：适合查询用户默认地址。
- `restaurant_categories(restaurant_id, is_primary)`：适合查询商家主分类。
- `invoice_records(order_id, invoice_status)`：适合查询订单开票状态。
- `appeal_tickets(order_id, ticket_status)`：适合查询订单申诉处理进度。
- `risk_control_logs(order_id, risk_level)`：适合查询订单风控记录。

---

## 四、外键与删除 / 更新策略建议

建议按业务语义为外键明确指定 `ON DELETE` 和 `ON UPDATE`：

- `orders.driver_id`：骑手被删除时设为 `NULL`，避免历史订单丢失。
- `orders.user_id`：用户删除后可设为 `NULL`，保留订单主记录。
- `order_items.order_id`：订单删除时级联删除商品明细。
- `payments.order_id`：若保留支付流水，建议 `SET NULL`；若禁止删除已支付订单，则用 `RESTRICT`。
- `notifications` 相关外键：通常建议 `SET NULL`，避免关联对象删除后通知记录全部丢失。

示例：

```sql
CONSTRAINT fk_orders_driver
    FOREIGN KEY (driver_id)
    REFERENCES drivers(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
```

---

## 五、状态字段约束建议

当前设计中多个状态字段使用 `VARCHAR`，建议至少加 `CHECK` 约束；若项目使用 PostgreSQL，也可以进一步改为 `ENUM` 类型。

例如：

```sql
status VARCHAR(30) NOT NULL DEFAULT 'pending'
CHECK (status IN ('pending', 'assigned', 'delivering', 'completed', 'cancelled'))
```

或 PostgreSQL `ENUM` 示例：

```sql
CREATE TYPE orders_status_enum AS ENUM (
    'pending',
    'assigned',
    'delivering',
    'completed',
    'cancelled'
);
```

```sql
status orders_status_enum NOT NULL DEFAULT 'pending'
```

说明：
- `CHECK` 更通用，跨数据库兼容性更好。
- `ENUM` 更严格，但后续扩展状态值时迁移成本更高。

---

## 六、精度与单位统一建议

为避免后续开发中出现单位不一致问题，建议统一约定：

- 经纬度：`DECIMAL(9,6)`
- 路线距离：`NUMERIC(6,2)`，单位为“公里”
- 交通延迟：`INTEGER`，单位为“分钟”
- 金额字段：统一使用 `DECIMAL(10,2)`

---

## 七、表关系说明

```text
users (1) -------- (N) orders
drivers (1) ------ (N) orders
restaurants (1) -- (N) orders
orders (1) ------- (N) order_items
orders (1) ------- (N) payments
drivers (1) ------ (N) driver_locations_history
users/drivers/orders ---- (N) notifications
drivers (1) ------ (N) driver_shifts
restaurants (1) -- (N) restaurant_business_hours
restaurants (1) -- (N) coupons
orders (1) ------- (N) order_status_logs
users (1) -------- (N) user_coupons
coupons (1) ------ (N) user_coupons
restaurants (1) -- (N) products
orders (1) ------- (N) dispatch_tasks
drivers (1) ------ (N) rider_performance_stats
orders (1) ------- (N) abnormal_orders
drivers (1) ------ (N) rider_rewards_penalties
restaurants (1) -- (N) merchant_settlements
orders (1) ------- (1) reviews
orders (1) ------- (N) refund_records
payments (1) ----- (N) refund_records
users (1) -------- (N) user_addresses
restaurants (1) -- (N) restaurant_categories
orders (1) ------- (N) invoice_records
orders (1) ------- (N) appeal_tickets
orders (1) ------- (N) risk_control_logs
traffic_snapshots 作为独立交通状态数据源，用于路径优化和 ETA 预测
delivery_sla_rules 作为独立 SLA 规则源，用于时效评估与履约判定
dispatch_rule_configs 作为独立调度规则源，用于派单策略控制
```

