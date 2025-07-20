# Product Requirements Document (PRD): Realtime Analysis and Trading Application

## 1. Project Brief

### 1.1 Problem Statement:
Individual traders lack a robust, low-latency application that combines real-time data analysis with automated, flexible, and risk-managed trade execution capabilities for intraday trading.

### 1.2 Proposed Solution:
Develop a high-performance, real-time analysis and trading application designed for individual traders. This application will:
* Ingest tick-by-tick data, order flow, and depth information from stock brokers.
* Provide robust analytical capabilities including technical indicators, pattern recognition, and statistical analysis.
* Enable users to define and automate their trading strategies using the application's native language, with support for specifying data timeframes and managing multiple instruments within a single strategy.
* Implement advanced risk management features, including continuous position monitoring, dynamic position size reduction based on adverse price movements or counter-position analysis, mandated stop-loss orders for all positions, and market selling as a fallback if stop-loss orders are not executed.
* Provide a User Interface (UI) for viewing analysis and detailed analytical information.
* Allow users to backtest strategies using historical data and conduct live testing (paper trading) without using real money.

### 1.3 Target Audience:
Individual traders focused on intraday trading, with trade durations typically ranging from 1 to 15 minutes. Users will utilize the application for both data analysis and the automation of their trading strategies.

### 1.4 Key Features & Capabilities (High-Level):

* **Real-time Data Ingestion**: Tick-by-tick, Order Flow, Market Depth.
* **Advanced Analytics Engine**: Technical Indicators, Pattern Recognition, Statistical Analysis, Market Movement Summaries, Price Reaction at Levels.
* **Flexible Strategy Automation**: Code-based strategies, custom timeframes, multi-instrument support, configurable parameters, live/paper mode specification.
* **Strategy Validation**: Backtesting with historical data, Paper Trading without real money.
* **Robust Risk Management**: Continuous position monitoring, dynamic position sizing, advanced stop-loss mechanisms (GTT + active monitoring), fallback to market execution.
* **User Interface (UI)**: Interactive charts (TradingView-like), visualization of analysis details, trade lists for live execution.
* **Performance**: Low-latency execution (under 300ms).
* **Broker Agnostic**: Interface for connecting to different brokers.
* **Application Management**: Scheduled tasks, automatic broker authentication.

### 1.5 Key Performance Indicators (KPIs - To be further defined):

* Latency of data processing and trade execution (specifically under 300ms).
* Reliability/Uptime of data feeds and trading engine.
* Accuracy of analytical outputs.
* Effectiveness of risk management mechanisms in preventing catastrophic losses.

## 2. User Stories

### 2.1 Data Ingestion & Viewing
* As an individual trader, I want the application to collect real-time tick-by-tick data, order flow, and depth information from my stock broker, so that I have the raw data for granular analysis.
* As an individual trader, I want the application to aggregate tick data into second-level and minute-level timeframes, so that I can perform analysis at different resolutions, especially during volatile market conditions.
* As an individual trader, I want the application to store all collected and aggregated data in a database, so that it can be reliably accessed for analysis, backtesting, and visualization.
* As an individual trader, I want the web application to display real-time and historical price, order flow, and aggregated data, so that I can visually understand market movements and inform my strategy decisions.
* As an individual trader, I want the web application to provide visualization tools for the collected data, so that I can easily identify patterns and insights to improve my trading strategies.
* As an individual trader, I want the application to run a specific job on startup to fetch necessary data from the broker, so that the application is initialized with the required information before trading begins.

### 2.2 Analysis & Visualization
* As an individual trader, I want to view real-time and historical market data on an interactive chart similar to TradingView, so that I can visually analyze price movements and identify patterns.
* As an individual trader developing or paper-trading a strategy, I want the chart to display the values calculated by my strategy (e.g., indicator lines, entry/exit signals), so that I can visually debug and refine my strategy's logic.
* As an individual trader developing or paper-trading a strategy, I want to see specific numerical values calculated by my strategy alongside the chart, so that I can precisely understand its internal state and decision-making process.
* As an individual trader, I want the analyses (technical indicators, patterns, statistical results) to be consumable by my automated strategies, so that the strategies can use these insights to execute trades.
* As an individual trader in live execution mode, I want to view a concise list of executed trades and their corresponding values (e.g., price, time, profit/loss) in the web application, so that I can monitor my live positions without detailed analytical visualizations.
* As an individual trader, I want the application to analyze and present a summary of market movements (e.g., opening gap, movement towards indicators, range-bound periods, closing change), so that I can quickly grasp the day's or period's price action.
* As an individual trader, I want the application to identify and display how price reacts at significant levels, such as previous day's high/low, all-time high/low, and other key technical levels, so that I can understand the market's behavior around critical points.

### 2.3 Strategy Creation & Management
* As a developer, I want to define each trading strategy as a separate code class, so that strategies are modular, maintainable, and easily extendable within the application's codebase.
* As an individual trader, I want the application to load all available strategies on startup, so that they are ready for use during live trading or testing.
* As an individual trader, I want to configure the specific instruments (single or multiple) that a strategy will monitor and trade, so that I can apply my strategy to the desired assets.
* As an individual trader, I want to configure various parameters for each strategy, so that I can customize its behavior without modifying the core strategy code.
* As an individual trader, I want to be able to explicitly specify whether a strategy should execute trades in a live (real money) environment or a paper trading (simulated) environment, so that I have control over the risk level of each strategy.
* As an individual trader, I want to be able to enable or disable specific strategies directly within the application's code, so that I have fine-grained control over which strategies are active.
* As an individual trader, I want an API endpoint to enable or disable strategies programmatically, so that I can dynamically control strategy activation without restarting the application.

### 2.4 Backtesting & Paper Trading
* As an individual trader, I want to initiate a backtest for a chosen strategy directly from the web application, so that I can evaluate its historical performance.
* As an individual trader, I want to specify the strategy parameters and the date range for a backtest within the web application, so that I can configure the test precisely.
* As an individual trader, I want to view the analysis, simulated trades, and overall results of a backtest within the web application, so that I can understand how my strategy performed historically.
* As an individual trader, I want to initiate a paper trading session for a strategy directly within the application's code, so that I can test its real-time behavior without financial risk.
* As an individual trader, I want to monitor the activity and simulated trades of a paper trading session within the web application, so that I can observe its performance in a live, risk-free environment.
* As an individual trader, I expect paper trading to simulate trade fills based on the Last Traded Price (LTP) received from the real-time data feed (assuming a broker is always present for data).
* As an individual trader, I expect paper trading to simulate trade execution by storing trades in the database without making actual calls to a stock broker, so that I can test strategies safely.

### 2.5 Trade Execution & Risk Management
* As an individual trader, I want my automated strategies to initiate trade orders when their conditions are met, so that the application can execute trades either with a real broker or in paper trading mode.
* As an individual trader, I expect real money trading to store trades in the database and also make API calls to the stock broker, so that my trades are accurately executed and recorded.
* As an individual trader, I want my strategies to include defined exit points and stop-loss logic, so that positions are managed and potential losses are contained.
* As an individual trader, I want my strategies to continuously monitor real-time prices against their defined exit and stop-loss levels, so that timely actions can be taken.
* As an individual trader, I want the application to dynamically reduce my position size if price movement does not confirm my strategy's conditions or if market volatility significantly increases, so that I can manage risk in adverse conditions.
* As an individual trader, I want the application to automatically place a Good Till Triggered (GTT) order at a market price with a safety stop limit, so that a protective measure is always in place for my positions.
* As an individual trader, I want the application to actively monitor the price relative to the GTT order's stop limit, so that it can place a precise stop-limit order when the price is near my desired stop loss.
* As an individual trader, I want the application to automatically cancel the corresponding GTT order once my position is closed, so that stale orders do not remain.
* As an individual trader, I expect the application to store orders and their statuses in the database, and maintain current positions in application memory for quick access.

## 3. Functional Requirements (FRs)

### 3.1 Data Ingestion & Viewing

**1. Broker Connectivity & Initialization:**
* **FR.DI.1.1**: The application **MUST** be designed with a broker-agnostic architecture, allowing for connection to various stock brokers.
* **FR.DI.1.2**: The application **MUST** support connectivity to brokers via REST API for tasks such as fetching historical data, placing orders, and querying account information.
* **FR.DI.1.3**: The application **MUST** support connectivity to brokers via WebSocket for real-time data streams (tick, order flow, depth).
* **FR.DI.1.4**: The application **MUST** provide a clear interface (e.g., a modular client structure) that allows new broker integrations to be written and connected without modifying core application logic.
* **FR.DI.1.5**: On application startup, a background job **MUST** automatically fetch an updated list of tradable instruments from the configured broker(s).
* **FR.DI.1.6**: On application startup, the background job **MUST** update the status of expired instruments in the system based on data from the broker.
* **FR.DI.1.7**: On application startup, the background job **MUST** obtain and manage an authentication token from the broker for subsequent API interactions.
* **FR.DI.1.8**: The application **MUST** securely store broker credentials to facilitate automatic authentication and connection for data feeds and trade execution.

**2. Data Point Capture & Storage:**
* **FR.DI.2.1**: The application **MUST** capture and store real-time tick-by-tick data.
    * *Elaboration on Data Points for Tick Data*: Timestamp, Instrument Identifier, Price, Quantity, Trade ID (if provided by broker), Exchange.
* **FR.DI.2.2**: The application **MUST** capture and store real-time order flow (level 2) or depth information.
    * *Elaboration on Data Points for Order Flow/Depth Data*: Timestamp, Instrument Identifier, Bid Price, Bid Quantity, Ask Price, Ask Quantity, Bid Levels (Price/Quantity), Ask Levels (Price/Quantity), Order ID (if applicable).
* **FR.DI.2.3**: The application **MUST** use PostgreSQL with the TimescaleDB extension for all data storage.
* **FR.DI.2.4**: All raw tick data and depth data **MUST** be stored persistently in the database to support comprehensive backtesting.
* **FR.DI.2.5**: The application **MUST** implement a data archiving mechanism to manage storage by moving or deleting old historical data after a configurable interval.

**3. Data Aggregation & Access:**
* **FR.DI.3.1**: The application **MUST** aggregate incoming tick data into second-level OHLC (Open, High, Low, Close) candles in real-time.
* **FR.DI.3.2**: Upon completion of each 5-minute interval, the application **MUST** use the corresponding second-level candles to generate a 5-minute OHLC candle.
* **FR.DI.3.3**: The application **MUST** support dynamic aggregation of data into various other timeframes (e.g., 1-minute, 15-minute) based on the requirements of active strategies and chosen instruments.
* **FR.DI.3.4**: The application **MUST** expose an API to serve real-time and historical aggregated candle data, order flow, and depth data to the web application.

### 3.2 Analysis & Visualization (UI Focus)

**1. Core Data Visualization:**
* **FR.AV.1.1**: The web application **MUST** display real-time and historical candle data using an interactive candlestick chart, leveraging the TradingView Lightweight Charts library.
* **FR.AV.1.2**: The web application **MUST** display real-time order flow and depth information in a distinct box format, showing current price, quantity, and indicators of directional movement.
* **FR.AV.1.3**: The web application **MUST** provide user interface controls for navigating (e.g., zoom, pan) historical data on charts.

**2. Advanced Visualization Features:**
* **FR.AV.2.1**: The web application **MUST** allow users to draw lines and boxes on the charts as extensions to the TradingView Lightweight Charts library.
* **FR.AV.2.2**: The web application **MUST** visualize Open Interest (OI) data in dedicated charts.
* **FR.AV.2.3**: The web application **MUST** allow users to select multiple strike prices for an instrument and display their combined Open Interest on the OI chart.

**3. Market Movement & Level Reaction Analysis Visualization:**
* **FR.AV.3.1**: The web application **MUST** display a summary of analyzed market movements for a selected period (e.g., "Price started 0.2% low, moved till 50EMA, moved in a range, ended at 0.1%").
* **FR.AV.3.2**: The web application **MUST** highlight or annotate on charts and/or in a dedicated summary how price reacted at significant levels (e.g., Previous Day High/Low, All-Time High/Low, and other key technical levels).

### 3.3 Strategy Creation & Management

**1. Strategy Definition & Loading:**
* **FR.SM.1.1**: The application **MUST** allow for the definition of each trading strategy as a separate code class.
* **FR.SM.1.2**: The application **MUST** provide a mechanism (e.g., code-based registration in a central file or through decorators if supported by the language/framework) to register strategies, including their configurable parameters and their default trading mode (live/paper).
* **FR.SM.1.3**: The application **MUST** load all registered strategies on startup, making them available for execution or testing.

**2. Strategy Configuration:**
* **FR.SM.2.1**: The application **MUST** enable configuration of strategy-specific parameters via external configuration files, supporting both YAML and JSON formats.
* **FR.SM.2.2**: The application **MUST** allow configuration of the specific instruments (single or multiple) that a strategy will monitor and trade, primarily through these configuration files.
* **FR.SM.2.3**: The application **MUST** allow explicit specification of a strategy's default execution mode (live or paper trading) within its configuration.
* **FR.SM.2.4**: The application **MUST** support initial database population or updates from external data sources (e.g., broker-provided YAML or CSV files) for elements like instrument lists.

**3. Strategy Control & Lifecycle:**
* **FR.SM.3.1**: The application **MUST** allow enabling or disabling specific strategies programmatically within the application's source code.
* **FR.SM.3.2**: The application **MUST** expose REST API endpoints to dynamically enable or disable specific strategies at runtime without requiring application restart.

### 3.4 Backtesting & Paper Trading

**1. Backtesting Core Functionality:**
* **FR.BP.1.1**: The web application **MUST** communicate with the backend via REST API to initiate backtesting sessions for a selected strategy.
* **FR.BP.1.2**: The web application **MUST** allow the user to specify strategy parameters and a precise date range for backtesting.
* **FR.BP.1.3**: The backend **MUST** execute the backtest using historical data stored in the database.
* **FR.BP.1.4**: The web application **MUST** display comprehensive backtest results, including:
    * Overall profit factor.
    * Number of winning trades.
    * Number of losing trades.
    * Detailed information for each simulated trade (e.g., entry/exit price, time, quantity, profit/loss).

**2. Paper Trading Core Functionality:**
* **FR.BP.2.1**: The application **MUST** allow for the initiation of a paper trading session for a strategy directly within the application's code.
* **FR.BP.2.2**: The web application **MUST** provide a dashboard or section to monitor the activity and simulated trades of ongoing paper trading sessions.
* **FR.BP.2.3**: During paper trading, the application **MUST** simulate trade fills based on the Last Traded Price (LTP) received from the real-time data feed (assuming a broker is always present for data).
* **FR.BP.2.4**: During paper trading, the application **MUST** store all simulated trades and their statuses in the database, without making any calls to a real broker.
* **FR.BP.2.5**: The web application **MUST** provide controls (e.g., buttons or toggles) to enable or disable individual strategies when operating in paper trading mode.

### 3.5 Trade Execution & Risk Management

**1. Order Initiation & Management:**
* **FR.ER.1.1**: Strategies **MUST** be able to initiate trade orders (buy/sell) when their internal conditions are met.
* **FR.ER.1.2**: The application **MUST** support initiating both **limit orders** (as primary) and **market orders** (as an option) from strategies.
* **FR.ER.1.3**: The application **MUST** store all initiated orders and their current statuses (e.g., pending, filled, cancelled, rejected) in the database.
* **FR.ER.1.4**: In live trading, the application **MUST** make API calls to the configured broker for actual order placement and receive status updates.

**2. Real-time Position & Data Handling:**
* **FR.ER.2.1**: The application **MUST** maintain all current open positions in memory for low-latency access and real-time monitoring.
* **FR.ER.2.2**: The application **MUST** continuously receive real-time data (ticks, order flow) via WebSocket from the broker, storing it both in memory and persistently in the database.

**3. Strategy-Driven Risk Control:**
* **FR.ER.3.1**: Strategies **MUST** be able to define and implement their own exit points and stop-loss logic.
* **FR.ER.3.2**: The application **MUST** continuously monitor real-time prices against the defined exit points and stop-loss levels within active strategies.
* **FR.ER.3.3**: The application **MUST** dynamically reduce existing position size if a strategy detects that market price movement does not confirm its initial entry conditions or if market volatility significantly increases (based on strategy-defined criteria).

**4. Advanced Stop-Loss Mechanism:**
* **FR.ER.4.1**: The application **MUST** automatically place a Good Till Triggered (GTT) order with the broker, set at a price level below the strategy's defined stop-loss, to act as a safety net.
* **FR.ER.4.2**: The application **MUST** actively monitor the real-time price as it approaches the strategy's stop-loss level.
* **FR.ER.4.3**: When the real-time price is near the strategy's stop-loss level, the application **MUST** attempt to close the position (e.g., by placing a market or stop-limit order) as quickly as possible.
* **FR.ER.4.4**: In the event that the application's primary attempt to close the position at stop-loss fails or is not executed for any reason, the pre-placed GTT order **MUST** trigger to ensure the position is closed, preventing further loss.
* **FR.ER.4.5**: Upon successful closure of a position (either by the application's primary action or the GTT trigger), the application **MUST** automatically cancel the corresponding GTT order to prevent unintended future execution.
* **FR.ER.4.6**: In the event of a broker data feed issue or disconnection (e.g., no data received), the application **MUST** display an immediate notification in the web application's UI.
* **FR.ER.4.7**: In the event of a broker data feed issue or disconnection where data is not being received, the application **MUST** automatically attempt to close all open positions to prevent further losses.

### 3.6 Application Management & Automation

**1. Scheduled Task Execution:**
* **FR.AM.1.1**: The application **MUST** provide a mechanism to automatically execute predefined functions or tasks at fixed, configurable times (e.g., connecting to the broker at market open, fetching daily reports).

## 4. Non-Functional Requirements (NFRs)

**1. Performance:**
* **NFR.P.1.1 (Latency)**: The application **MUST** achieve an execution latency of under 300ms for critical trading operations (e.g., order placement, risk checks).
* **NFR.P.1.2 (Data Throughput)**: The application **MUST** be capable of processing approximately 10 real-time WebSocket messages per second per instrument.
* **NFR.P.1.3 (UI Responsiveness)**: The web application's UI **MUST** provide continuous, real-time updates to charts and data displays with minimal perceived lag, ensuring a smooth user experience, particularly during volatile market conditions.
* **NFR.P.1.4 (Concurrency)**: The backend system **MUST** support the concurrent operation of 30-40 active strategies with minimal performance degradation.
* **NFR.P.1.5 (UI Interaction Latency)**: UI interactions (e.g., loading charts, applying filters) **SHOULD** respond quickly to user input to maintain intuitiveness.

**2. Scalability:**
* **NFR.S.1.1 (Instrument Capacity)**: The application **MUST** support monitoring and trading for up to 500 distinct instruments without significant performance degradation.
* **NFR.S.1.2 (Deployment Model)**: The initial deployment of the application **WILL** run as a single instance, with future horizontal scalability not being a primary concern for the immediate roadmap.
* **NFR.S.1.3 (Data Volume Growth)**: The data storage solution **MUST** be able to accommodate the continuous influx of tick and depth data for the specified number of instruments over time, with archiving capabilities to manage long-term storage.

**3. Reliability & Availability:**
* **NFR.R.1.1 (Robustness)**: The application **MUST** be robust and designed to remain operational for extended periods, minimizing unexpected crashes or failures.
* **NFR.R.1.2 (Error Handling)**: The application **MUST** gracefully handle unexpected errors, data feed interruptions, and broker API disconnections, including auto-reconnection attempts where appropriate.
* **NFR.R.1.3 (Data Integrity)**: The application **MUST** ensure the integrity of stored data, especially trade records and position states, even in the event of system failures.

**4. Security:**
* **NFR.SE.1.1 (Authentication)**: The application **MUST** implement a basic user authentication mechanism (e.g., username/password login).
* **NFR.SE.1.2 (Optional MFA)**: The implementation of Multi-Factor Authentication (MFA) **IS DESIRABLE** but not a critical priority for the initial release.
* **NFR.SE.1.3 (Data Protection)**: Sensitive data, including broker credentials and trade history, **MUST** be protected both at rest (e.g., encryption for database fields) and in transit (e.g., using HTTPS/WSS for API communication).

**5. Usability:**
* **NFR.U.1.1 (Intuitiveness)**: The web application UI **MUST** be intuitive and easy for individual traders to learn and use, minimizing the learning curve for core functionalities.
* **NFR.U.1.2 (Feedback)**: The application **SHOULD** provide clear and timely feedback to the user on system status, strategy activity, and trade outcomes.

**6. Maintainability & Extensibility:**
* **NFR.M.1.1 (Modular Broker Integration)**: The application **MUST** implement clear abstractions and interfaces for broker integrations, allowing for easy addition of new broker clients in the future.
* **NFR.M.1.2 (Modular Strategies & Analytics)**: The framework for defining strategies and analytical components **MUST** follow clear abstractions and design patterns, facilitating the addition, modification, and maintenance of new strategies and analytical methods.
* **NFR.M.1.3 (Code Quality)**: The codebase **SHOULD** adhere to established coding standards and be well-documented to ensure long-term maintainability.

## 5. Assumptions, Constraints, and Dependencies

**1. Assumptions:**
* **AS.1.1 (Broker Data Reliability)**: It is assumed that broker data feeds and APIs are generally reliable for continuous operation. Any intermittent issues will be handled as specific exception cases (as defined in FR.ER.4.6 and FR.ER.4.7).
* **AS.1.2 (Programmer-Written Strategies)**: It is assumed that trading strategies will be developed and maintained by a programmer with appropriate coding skills.
* **AS.1.3 (Deployment Environment)**: The application is assumed to be deployed on a Virtual Private Server (VPS) with stable internet connectivity and sufficient resources to ensure its continuous operation.

**2. Constraints:**
* **CO.1.1 (POC Timeline)**: A Proof of Concept (POC) for the application **MUST** be developed and demonstrated within a one-week timeframe.
* **CO.1.2 (Deployment Environment)**: The application **MUST** be deployable and run effectively within a VPS environment.
* **CO.1.3 (Technology Stack - Preferred)**: The application **MUST** utilize TradingView Lightweight Charts for all charting functionalities.
* **CO.1.4 (Technology Stack - Preferred)**: The application **MUST** use PostgreSQL with the TimescaleDB extension for all time-series data storage.
* **CO.1.5 (Technical Architecture)**: The core application **MUST** be developed with an asynchronous execution model, prioritizing low latency, best possible performance, and strong type support.
* **CO.1.6 (Frontend Framework)**: The frontend user interface **MUST** be developed using the Svelte framework.

**3. Dependencies:**
* **DP.1.1 (Broker APIs/Data Feeds)**: The application is dependent on the availability and functionality of the chosen stock broker's REST APIs and WebSocket data feeds.
* **DP.1.2 (TradingView Lightweight Charts Library)**: The frontend visualization is dependent on the features and stability of the TradingView Lightweight Charts library.
* **DP.1.3 (PostgreSQL & TimescaleDB)**: The data storage and retrieval capabilities are dependent on the stability and performance of PostgreSQL with the TimescaleDB extension.

---

This document encapsulates all the requirements and details discussed for your Realtime Analysis and Trading Application. You can copy and save this content as a markdown file (e.g., `prd.md`) for your project documentation.