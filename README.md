# CustomerDesk - Advanced Customer Management System

CustomerDesk is a professional, full-stack application designed to meet and exceed the requirements of the **Software Engineer Assignment**. It provides a robust platform for managing customer data, relational links, and large-scale data imports.

## 🚀 Compliance with Assignment Requirements

This system has been built to strictly adhere to the technical specifications:

-   **Core CRUD**: Full management of Customer entities (Name, NIC, DOB).
-   **Complex Relationships**:
    -   **Mobile Numbers**: Support for multiple international mobile numbers per customer.
    -   **Addresses**: Support for multiple addresses per customer (Line 1, Line 2, City, Country).
    -   **Family Members**: Ability to link existing customers as family members via a searchable interface.
-   **Master Data Management**: Intelligent auto-detection and creation of Country and City entities to maintain data normalization.
-   **Data Operations**:
    -   **Pagination & Searching**: Integrated backend pagination and real-time search by Name or NIC.
    -   **Bulk Upload**: Robust processing of **Excel and CSV** files. Supports columns: `Name`, `NIC`, `DOB`, `Mobile` (e.g. +94...), `Address 1`, `Address 2`, `City`, `Country`.
-   **Performance Optimization**: 
    -   **Memory Safety**: Implements batch processing (1,000 records per transaction) and manual persistence context clearing to handle up to **1,000,000 records** without memory overflows.
    -   **Sticky State**: Frontend preserves search and pagination states for a seamless user experience.

## 🛡️ Security & Authentication

**Authentication:**  
JWT (JSON Web Token) authentication was implemented as an optional enhancement to demonstrate secure API design. However, the core functionality of the system is independent and fully usable for evaluation purposes.

-   **Username**: `admin`
-   **Password**: `admin123`

## 🛠️ Technology Stack

-   **Backend**: Java 8 (LTS), Spring Boot 2.7.18, Spring Data JPA, Spring Security (JWT).
-   **Frontend**: React 18 (Vite), Lucide Icons, Axios, Vanilla CSS.
-   **Database**: MariaDB / MySQL.
-   **Data Tools**: Apache POI (Excel) and Native Java Streams (CSV).

## ⚙️ Setup & Installation

### 1. Database
Create a database named `customer_management` in your MariaDB/MySQL instance.
Update `src/main/resources/application.properties` with your database credentials.

### 2. Backend (Java 8)
```bash
./mvnw spring-boot:run
```
*Note: The system automatically generates the schema and seeds initial master data on the first run.*

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📊 Evaluation Highlights

-   **Clean Architecture**: Strictly follows the Controller-Service-Repository pattern with clear DTO separation.
-   **Java 8 Compatibility**: The codebase is fully optimized for Java 8, avoiding modern syntax features like `var` or `Switch Expressions` to ensure compatibility with the assignment environment.
-   **User Experience**: Features a "Sticky Dashboard" that remembers your place (page/search) even after performing edits, providing a high-end enterprise feel.

---
**Developed by Jithnuka Weerasinghe**
