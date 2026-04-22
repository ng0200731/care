# Product Requirements Document: Care Label Layout Management System

**Version:** 1.0
**Date:** 2026-01-08

---

### 1. Overview

The Care Label Layout Management System is a comprehensive web application designed to streamline the creation, management, and tracking of care labels for products. The system, internally named "AI Coordinate Viewer," provides tools for designing label layouts, managing reusable content (`Master Files`), organizing multi-page `Projects`, and tracking `Orders` and `Suppliers`.

The application appears to leverage PDF technology for rendering and manipulation of labels and may include AI-assisted features for element positioning and validation.

### 2. Target Audience

The primary users of this system are likely:

*   **Label Designers & Compliance Officers:** Individuals responsible for creating and ensuring the accuracy of care labels.
*   **Production Managers:** Staff who manage the workflow from design to production, including orders and supplier coordination.
*   **Administrators:** Users who manage the system's settings and core data like master files and supplier information.

### 3. Core Features

Based on the application structure, the system includes the following key modules:

*   **Dashboard:** A central hub providing an overview of recent activity, quick access to different modules, and key metrics.

*   **Master Files Management:**
    *   Create, edit, and manage reusable templates or components for care labels (e.g., washing symbols, legal disclaimers, material compositions).
    *   This feature helps ensure consistency and reduces repetitive work.

*   **Project Management:**
    *   Create and manage multi-page label projects.
    *   Assemble labels for a specific product line or collection using master files and custom content.
    *   A coordinate viewer/canvas for designing and arranging elements on a label.

*   **Order Management:**
    *   Track and manage orders for care labels.
    *   Link orders to specific projects, customers, or suppliers.

*   **Supplier Management:**
    *   Maintain a database of supplier information.
    *   Associate suppliers with specific orders or materials.

*   **Settings:**
    *   Configure system-wide settings, such as text overflow analysis parameters to prevent text from being cut off on the final printed label.

### 4. Technical Architecture

The application is built with a modern web stack:

*   **Frontend:**
    *   **Framework:** React (v19) with TypeScript.
    *   **Routing:** `react-router-dom` for navigation.
    *   **PDF Handling:** `jspdf` and `pdf-lib` for creating, modifying, and viewing PDF documents.
    *   **UI:** Custom-styled components.

*   **Backend:**
    *   **Framework:** Node.js with Express.
    *   **Database:** A SQL database managed via Prisma ORM (the specific database is likely SQLite for development, as indicated by `dev.db`).
    *   **API:** A RESTful API to serve data to the React frontend.

### 5. Future Considerations

While not explicitly found in the code, potential future enhancements could include:

*   **AI-Powered Coordinate Suggestions:** An AI model that suggests optimal placement for text and symbols on a label to improve readability and compliance.
*   **Multi-language Support:** Tools for managing translations of label content.
*   **Advanced User Roles & Permissions:** More granular control over what different user types can see and do.
*   **Integration with External Systems:** APIs for connecting with ERP or e-commerce platforms.


