# Order Variable System - Preliminary Design Document

## 📋 Overview

The Order Variable System allows users to manage order-by-order variable data within projects. Each project can have multiple master files, and each master file can define its own set of variables. Users can input different values for each order.

### Example Use Case:
**Project: TCL-2025 (ABC Garment Factory)**
- **Order #001**: Composition = "100% Cotton", Size = "M"
- **Order #002**: Composition = "99% Polyester, 1% Cotton", Size = "L"
- **Order #003**: Composition = "50% Cotton, 50% Linen", Size = "XL"

---

## 🎯 Key Features

1. **Project-based organization**: Orders linked to projects and customers
2. **Master file specific variables**: Each master file has different variables
3. **Order-by-order data input**: Manually input data for each order
4. **Variable replacement in text**: Use `{{variableName}}` placeholders
5. **Order status management**: Draft, Send, Confirmed, etc.
6. **Order history tracking**: View and manage submitted orders

---

## 📊 UI Structure

### 1. Master File Selection with ORDER Icon

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Project: TCL-2025                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Select Master File:                                            │
│                                                                 │
│  ┌───────────────────────────────────────────────┐             │
│  │ 📄 test-child-padding              📦 [ORDER] │             │
│  │    Modified: 2025-01-15                       │             │
│  └───────────────────────────────────────────────┘             │
│                                                                 │
│  ┌───────────────────────────────────────────────┐             │
│  │ 📄 composition-template            📦 [ORDER] │             │
│  │    Modified: 2025-01-14                       │             │
│  └───────────────────────────────────────────────┘             │
│                                                                 │
│  ┌───────────────────────────────────────────────┐             │
│  │ 📄 multi-line-settings             📦 [ORDER] │             │
│  │    Modified: 2025-01-12                       │             │
│  └───────────────────────────────────────────────┘             │
│                                                                 │
│  [+ New Master File]                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Left Menu with ORDER (No Sub-menu)

```
┌─────────────────────────────────┐
│  LEFT MENU                      │
├─────────────────────────────────┤
│                                 │
│  📁 Projects                    │
│                                 │
│  🎨 Templates                   │
│                                 │
│  ⚙️  Settings                   │
│                                 │
│  📦 ORDER                       │
│                                 │
│                                 │
└─────────────────────────────────┘
```

### 3. Full Layout - Left Menu + Right Frame (NEW Tab Active)

```
┌──────────────┬──────────────────────────────────────────────────────────────────────┐
│ LEFT MENU    │  RIGHT BIG FRAME                                                     │
├──────────────┼──────────────────────────────────────────────────────────────────────┤
│              │  ┌────────────────────────────────────────────────────────────────┐ │
│ 📁 Projects  │  │  ORDER MANAGEMENT                                              │ │
│              │  ├────────────────────────────────────────────────────────────────┤ │
│ 🎨 Templates │  │                                                                │ │
│              │  │  ┌══════════════════┐  ┌───────────────────────────┐          │ │
│ ⚙️ Settings  │  │  │   📝 NEW         │  │   📚 ORDER HISTORY        │          │ │
│              │  │  └══════════════════┘  └───────────────────────────┘          │ │
│ 📦 ORDER ✓   │  │  ═══════════════════════════════════════════════════          │ │
│              │  │                                                                │ │
│              │  │  Create New Order:                                             │ │
│              │  │                                                                │ │
│              │  │  ┌──────────────────────────────────────────────────────┐     │ │
│              │  │  │  a) 👤 CUSTOMER MANAGEMENT                           │     │ │
│              │  │  │     Customer Name:  [ABC Garment Factory_______]    │     │ │
│              │  │  │     Contact:        [John Smith_____________]       │     │ │
│              │  │  │     Phone:          [+1-555-1234____________]       │     │ │
│              │  │  │     Email:          [john@abc.com___________]       │     │ │
│              │  │  │     Address:        [___________________]           │     │ │
│              │  │  │                                                      │     │ │
│              │  │  │  b) 📋 PROJECT INFORMATION                           │     │ │
│              │  │  │     Project Name:   [TCL-2025 ▼]                    │     │ │
│              │  │  │     Master File:    [test-child-padding ▼]          │     │ │
│              │  │  │     Date:           2025-01-20                       │     │ │
│              │  │  │                                                      │     │ │
│              │  │  │  c) 📝 ORDER DATA                                    │     │ │
│              │  │  │     Order Number:   [#001__________]                │     │ │
│              │  │  │                                                      │     │ │
│              │  │  │     Variable Fields (for selected master):          │     │ │
│              │  │  │     Composition (Text): [100% Cotton_________]      │     │ │
│              │  │  │     Size (Dropdown):    [M ▼]                       │     │ │
│              │  │  │     Quantity (Number):  [500______]                 │     │ │
│              │  │  │                                                      │     │ │
│              │  │  │     [+ Add Variable Field]                           │     │ │
│              │  │  │                                                      │     │ │
│              │  │  │  d) 📤 SUBMIT OPTIONS                                │     │ │
│              │  │  │     Status: [Draft ▼]                                │     │ │
│              │  │  │                                                      │     │ │
│              │  │  │  [💾 Save Draft]  [📤 Submit Order]                 │     │ │
│              │  │  └──────────────────────────────────────────────────────┘     │ │
│              │  │                                                                │ │
│              │  └────────────────────────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

### 4. Full Layout - Left Menu + Right Frame (ORDER HISTORY Tab Active)

```
┌──────────────┬──────────────────────────────────────────────────────────────────────┐
│ LEFT MENU    │  RIGHT BIG FRAME                                                     │
├──────────────┼──────────────────────────────────────────────────────────────────────┤
│              │  ┌────────────────────────────────────────────────────────────────┐ │
│ 📁 Projects  │  │  ORDER MANAGEMENT                                              │ │
│              │  ├────────────────────────────────────────────────────────────────┤ │
│ 🎨 Templates │  │                                                                │ │
│              │  │  ┌──────────────────┐  ┌═══════════════════════════┐          │ │
│ ⚙️ Settings  │  │  │   📝 NEW         │  │   📚 ORDER HISTORY        │          │ │
│              │  │  └──────────────────┘  └═══════════════════════════┘          │ │
│ 📦 ORDER ✓   │  │  ═══════════════════════════════════════════════════          │ │
│              │  │                                                                │ │
│              │  │  Filter: [All ▼] [Draft] [Sent] [Confirmed]...                │ │
│              │  │                                                                │ │
│              │  │  ┌──────────────────────────────────────────────────────┐     │ │
│              │  │  │ 📤 Order #001                       Status: SENT     │     │ │
│              │  │  │    Date: 2025-01-20 10:30 AM                         │     │ │
│              │  │  │    Project: TCL-2025 | Master: test-child-padding    │     │ │
│              │  │  │    Customer: ABC Garment Factory                     │     │ │
│              │  │  │    ─────────────────────────────────────────────     │     │ │
│              │  │  │    Composition: 100% Cotton                          │     │ │
│              │  │  │    Size: M | Quantity: 500                           │     │ │
│              │  │  │                                                      │     │ │
│              │  │  │    [View] [Edit] [Print] [Change Status ▼]          │     │ │
│              │  │  └──────────────────────────────────────────────────────┘     │ │
│              │  │                                                                │ │
│              │  │  ┌──────────────────────────────────────────────────────┐     │ │
│              │  │  │ 💾 Order #002                       Status: DRAFT    │     │ │
│              │  │  │    Date: 2025-01-19 3:15 PM                          │     │ │
│              │  │  │    Project: TCL-2025 | Master: composition-template  │     │ │
│              │  │  │    Customer: ABC Garment Factory                     │     │ │
│              │  │  │    ─────────────────────────────────────────────     │     │ │
│              │  │  │    Material 1: Cotton | 60%                          │     │ │
│              │  │  │    Material 2: Polyester | 40%                       │     │ │
│              │  │  │                                                      │     │ │
│              │  │  │    [Continue Edit] [Delete] [Send]                   │     │ │
│              │  │  └──────────────────────────────────────────────────────┘     │ │
│              │  │                                                                │ │
│              │  │  [Export All] [Print All]                                      │ │
│              │  │                                                                │ │
│              │  └────────────────────────────────────────────────────────────────┘ │
└──────────────┴──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                        COMPLETE FLOW                            │
└─────────────────────────────────────────────────────────────────┘

STEP 1: Click ORDER in Left Menu
   LEFT MENU: 📦 ORDER ← CLICK
                ↓
   RIGHT FRAME: Shows 2 BIG TABS
   ┌─────────────────────────────────┐
   │ 📝 NEW | 📚 ORDER HISTORY       │
   └─────────────────────────────────┘

STEP 2: NEW Tab - Create Order
   ┌─────────────────────────────────┐
   │ 📝 NEW Tab (Active)             │
   │ a) Customer info                │
   │ b) Select Project/Master        │
   │ c) Input variable fields        │
   │ d) Select status                │
   │                                 │
   │ [Save Draft] [Submit Order]     │
   └─────────────────────────────────┘
          ↓                    ↓
    Save Draft           Submit Order
          ↓                    ↓
   Stays in NEW         Goes to ORDER HISTORY
   (can edit later)     (with status)

STEP 3: Use Variables in Multi-line/Comp Trans
   When Variable: ON
   Text: {{composition}} {{size}}
   → Replaces with actual order values

STEP 4: ORDER HISTORY Tab
   View all submitted orders
   Filter by status
   Edit/Print/Change status
```

---

## 🔄 Master File & Variables Relationship

### Different Masters Have Different Variables

```
PROJECT: TCL-2025
├── Master: test-child-padding
│   └── Variables:
│       • composition (Text)
│       • size (Dropdown: S/M/L/XL)
│       • quantity (Number)
│
├── Master: multi-line-settings
│   └── Variables:
│       • text_content (Text)
│       • line_spacing (Number)
│       • alignment (Dropdown: Left/Center/Right)
│
└── Master: composition-template
    └── Variables:
        • material_1 (Text)
        • material_1_percent (Number)
        • material_2 (Text)
        • material_2_percent (Number)
```

### When Clicking ORDER on Each Master:

```
📦 [ORDER] on "test-child-padding"
→ ORDER panel shows:
   Variables: composition, size, quantity
   Orders: #001, #002 (with these variables)

📦 [ORDER] on "multi-line-settings"
→ ORDER panel shows:
   Variables: text_content, line_spacing, alignment
   Orders: #001, #002 (with these variables)

📦 [ORDER] on "composition-template"
→ ORDER panel shows:
   Variables: material_1, material_1_percent, material_2, material_2_percent
   Orders: #001, #002 (with these variables)
```

---

## 🎨 Variable Integration in Dialogs

### Multi-line Text Dialog with Variable Toggle

```
MAIN SCREEN                                    LEFT MENU - ORDER
┌──────────────────────────────────────┐      ┌──────────────────────────────────┐
│  ← Project: TCL-2025                 │      │  ▼ 📦 ORDER                     │
├──────────────────────────────────────┤      ├──────────────────────────────────┤
│                                      │      │                                  │
│  Master: test-child-padding          │      │  a) 👤 CUSTOMER                 │
│  📦 [ORDER] ← Clicked                │      │     ABC Garment Factory         │
│                                      │      │     john@abc.com                │
│  Multi-line Text Dialog:             │      │                                  │
│  ┌────────────────────────────────┐  │      │  b) 📋 PROJECT INFO             │
│  │ Text Content  [Variable: ON ✓] │  │      │     Project: TCL-2025           │
│  │                                │  │      │     Master: test-child-padding  │
│  │ Text:                          │  │      │                                  │
│  │ ┌────────────────────────────┐ │  │      │  c) 📝 ORDER DATA               │
│  │ │Composition: {{composition}}│ │  │      │     ┌─────────────────────────┐ │
│  │ │Size: {{size}}              │ │  │      │     │ Order: [#001 ▼]         │ │
│  │ │Quantity: {{quantity}}      │ │  │      │     │                         │ │
│  │ └────────────────────────────┘ │  │      │     │ Composition:            │ │
│  │                                │  │      │     │ [100% Cotton_______]    │ │
│  │ Preview (Order #001):          │  │      │     │                         │ │
│  │ → Composition: 100% Cotton     │  │      │     │ Size: [M ▼]            │ │
│  │ → Size: M                      │  │      │     │                         │ │
│  │ → Quantity: 500                │  │      │     │ Quantity: [500____]    │ │
│  └────────────────────────────────┘  │      │     │                         │ │
│                                      │      │     │ [Save]                  │ │
│                                      │      │     └─────────────────────────┘ │
│                                      │      │                                  │
│                                      │      │  Orders:                         │
│                                      │      │  • #001 (Active) ✓              │
│                                      │      │  • #002                          │
│                                      │      │  • #003                          │
│                                      │      │                                  │
│                                      │      │  [+ Add Order]                   │
└──────────────────────────────────────┘      └──────────────────────────────────┘
```

---

## 🏗️ Technical Architecture

### File Structure

```
src/
├── services/
│   └── orderVariableSystem.ts          # Core logic & data management
│
├── contexts/
│   └── OrderVariableContext.tsx        # React Context provider
│
├── components/
│   ├── OrderPanel.tsx                  # Main ORDER panel in left menu
│   ├── NewOrderTab.tsx                 # NEW tab content
│   ├── OrderHistoryTab.tsx             # ORDER HISTORY tab content
│   ├── CustomerManagementForm.tsx      # Customer info form
│   ├── OrderDataForm.tsx               # Order variable input form
│   ├── OrderListItem.tsx               # Order item in history
│   └── OrderVariableInput.tsx          # Individual variable input field
│
└── types/
    └── orderTypes.ts                   # TypeScript interfaces
```

### Data Models

```typescript
// Variable Definition
interface OrderVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'dropdown';
  dropdownOptions?: string[];
  defaultValue?: string | number;
}

// Order
interface Order {
  id: string;
  orderNumber: string;
  projectId: string;
  masterId: string;
  customerName?: string;
  variables: OrderVariableValue[];
  status: 'draft' | 'send' | 'confirmed' | 'in_production' | 'completed';
  createdAt: string;
  updatedAt: string;
}

// Project with Orders
interface ProjectOrderData {
  projectId: string;
  projectName: string;
  customerName: string;
  masters: MasterFileData[];
}

// Master File Data
interface MasterFileData {
  masterId: string;
  masterName: string;
  availableVariables: OrderVariable[];
  orders: Order[];
}
```

---

## ✅ Key User Actions

### 1. Click 📦 ORDER in Left Menu
- **Action**: User clicks ORDER in left menu
- **Result**:
  - Right frame shows 2 BIG TABS: NEW | ORDER HISTORY
  - NEW tab is active by default
  - Ready to create new order

### 2. Create New Order (NEW Tab)
- **Steps**:
  1. Fill customer information
  2. Select Project and Master file from dropdowns
  3. Manually add variable fields (based on selected master)
  4. Input order data for each variable
  5. Select status (Draft/Send/etc.)
  6. Click [Save Draft] or [Submit Order]

### 3. View Order History
- **Actions**:
  - Click ORDER HISTORY tab
  - Filter by status (All/Draft/Sent/Confirmed/etc.)
  - View order details
  - Edit/Print orders
  - Change order status

### 4. Use Variables in Text (Variable Toggle ON)
- **Multi-line Text Dialog / Comp Trans Dialog**:
  - Toggle "Variable: ON"
  - Use `{{variableName}}` in text
  - Select current order from dropdown
  - Preview shows actual values from selected order
  - When printing, values auto-replace placeholders

---

## 📝 Order Status System

### Status Flow
```
NEW (Draft) → SEND → CONFIRMED → IN PRODUCTION → COMPLETED
     ↓
  [Save Draft] - stays in NEW tab with Draft status
     ↓
  [Submit Order] - moves to ORDER HISTORY with selected status
```

### Status Types (Expandable)
- **Draft**: Work in progress, not submitted
- **Send**: Sent to customer/factory
- **Confirmed**: Order confirmed by recipient
- **In Production**: Currently being manufactured
- **Completed**: Order finished
- *(More statuses to be added later)*

---

## 🔗 Integration Points

### 1. Master File Selection Screen
- Add 📦 [ORDER] icon to each master file item
- Click handler opens ORDER panel

### 2. Left Menu
- Add ORDER section below Settings
- Collapsible panel with 2 tabs (NEW, ORDER HISTORY)

### 3. Multi-line Text Dialog
- Variable toggle button already added ✅
- Connect to order variable context
- Show order selector dropdown when Variable: ON
- Replace `{{placeholders}}` with actual values

### 4. Comp Trans Dialog
- Variable toggle button already added ✅
- Same integration as multi-line dialog

### 5. Future Dialogs
- All new CT dialogs will support variable toggle
- Use same integration pattern

---

## 🎯 Development Phases

### Phase 1: Core Infrastructure ✅
- [x] Create orderVariableSystem.ts service
- [x] Create OrderVariableContext.tsx
- [x] Add variable toggle to dialogs

### Phase 2: ORDER Panel UI (Next)
- [ ] Create OrderPanel component
- [ ] Create NewOrderTab component
- [ ] Create OrderHistoryTab component
- [ ] Integrate with left menu

### Phase 3: Forms & Input
- [ ] Create CustomerManagementForm
- [ ] Create OrderDataForm with variable inputs
- [ ] Create OrderVariableInput component

### Phase 4: Integration
- [ ] Add ORDER icon to master file list
- [ ] Connect variable toggle to order data
- [ ] Implement text replacement in dialogs

### Phase 5: Features
- [ ] Order status management
- [ ] Filter and search
- [ ] Export and print functionality
- [ ] Order history management

---

## 📌 Important Notes

1. **Each master file has different variables** - Variables are master-specific, not project-wide
2. **Manual variable input** - Users manually define and input variable fields
3. **Simple ORDER menu** - Click ORDER in left menu → Right frame shows 2 tabs (no sub-menu)
4. **2 BIG TABS always visible** - NEW tab and ORDER HISTORY tab in right frame
5. **Status system expandable** - Order statuses can be expanded in the future
6. **Variable placeholder format** - Use `{{variableName}}` in text for replacement

---

## 🚀 Next Steps

1. Review and approve this design document
2. Begin Phase 2: ORDER Panel UI development
3. Create component structure
4. Implement NEW tab functionality
5. Implement ORDER HISTORY tab
6. Test integration with existing dialogs

---

## 📅 Document Info

- **Created**: 2025-01-20
- **Status**: Preliminary Design - Awaiting Approval
- **Version**: 1.0
- **Last Updated**: 2025-01-20
