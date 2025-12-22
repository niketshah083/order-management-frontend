import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LoginComponent } from './components/login/login.component';
import { ItemMasterComponent } from './components/items/item-master.component';
import { OrderMasterComponent } from './components/orders/order-master.component';
import { PurchaseOrderCreateComponent } from './components/purchase-orders/purchase-order-create.component';
import { PurchaseOrderListComponent } from './components/purchase-orders/purchase-order-list.component';
import { UserMasterComponent } from './components/users/user-master.component';
import { InternalUserMasterComponent } from './components/internal-users/internal-user-master.component';
import { BillingMasterComponent } from './components/billing/billing-master.component';
import { BillingHistoryComponent } from './components/billing/billing-history.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ManagerDashboardComponent } from './components/manager-dashboard/manager-dashboard.component';
import { DistributorDashboardComponent } from './components/distributor-dashboard/distributor-dashboard.component';
import { CustomerMasterComponent } from './components/customers/customer-master.component';
import { PaymentRequestsComponent } from './components/payment-requests/payment-requests.component';
import { PaymentRequestsAdminComponent } from './components/payment-requests/payment-requests-admin.component';
import { ReturnsComponent } from './components/returns/returns.component';
import { ApprovalsComponent } from './components/approvals/approvals.component';
import { CategoryMasterComponent } from './components/categories/category-master.component';
import { PurchaseReturnCreateComponent } from './components/returns/purchase-return-create.component';
import { SalesReturnCreateComponent } from './components/returns/sales-return-create.component';
import { PurchaseReturnListComponent } from './components/returns/purchase-return-list.component';
import { SalesReturnListComponent } from './components/returns/sales-return-list.component';
import { AdminPoReturnsApprovalComponent } from './components/returns/admin-po-returns-approval.component';
import { DistributorPoReturnsComponent } from './components/returns/distributor-po-returns.component';
import { ReportsComponent } from './components/reports/reports.component';
import { DistributorLedgerComponent } from './components/distributor-ledger/distributor-ledger.component';
import { InventoryMasterComponent } from './components/inventory/inventory-master.component';
import { InventoryEnterpriseComponent } from './components/inventory/inventory-enterprise.component';
import { InWardComponent } from './components/purchase-orders/in-ward.component';
import { GrnCreateComponent } from './components/grn/grn-create.component';
import { GrnDetailComponent } from './components/grn/grn-detail.component';
import { AdminPaymentEntriesListComponent } from './components/admin-payment-entries/admin-payment-entries-list.component';
import { AdminPaymentEntriesFormComponent } from './components/admin-payment-entries/admin-payment-entries-form.component';
import { AdminPaymentEntriesDetailComponent } from './components/admin-payment-entries/admin-payment-entries-detail.component';
import { ProductTraceComponent } from './components/product-trace/product-trace.component';
import { QuickInvoiceComponent } from './components/quick-invoice/quick-invoice.component';
import { AnalyticsDashboardComponent } from './components/analytics-dashboard/analytics-dashboard.component';

const authGuard = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : auth.logout();
};

const adminGuard = () => {
  const auth = inject(AuthService);
  return auth.isAdmin() ? true : false;
};

const distributorGuard = () => {
  const auth = inject(AuthService);
  return auth.isDistributor() ? true : false;
};

const managerGuard = () => {
  const auth = inject(AuthService);
  return auth.isManager() ? true : false;
};

const loginGuard = () => {
  const router = inject(Router);
  const auth = inject(AuthService);

  if (auth.isAuthenticated()) {
    const role = auth.getCurrentUserRole();
    if (role === 'DISTRIBUTOR') {
      return router.navigate(['/distributor-dashboard']);
    } else if (role === 'MANAGER') {
      return router.navigate(['/payment-tracking']);
    } else if (role === 'SUPER_ADMIN') {
      return router.navigate(['/dashboard']);
    } else if (role === 'CUSTOMER') {
      return router.navigate(['/items']);
    }
    return true;
  } else {
    return true;
  }
};

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  {
    path: 'items',
    component: ItemMasterComponent,
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    component: OrderMasterComponent,
    canActivate: [authGuard]
  },
  {
    path: 'purchase-orders/create',
    component: PurchaseOrderCreateComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'purchase-orders/edit/:id',
    component: PurchaseOrderCreateComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'purchase-orders',
    component: PurchaseOrderListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'billing',
    component: BillingMasterComponent,
    canActivate: [authGuard]
  },
  {
    path: 'billing/edit/:id',
    component: BillingMasterComponent,
    canActivate: [authGuard]
  },
  {
    path: 'billing-history',
    component: BillingHistoryComponent,
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    component: CustomerMasterComponent,
    canActivate: [authGuard]
  },
  {
    path: 'payment-requests',
    component: PaymentRequestsComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'returns',
    component: ReturnsComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'returns/purchase/create',
    component: PurchaseReturnCreateComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'returns/sales/create',
    component: SalesReturnCreateComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'returns/purchase-list',
    component: PurchaseReturnListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'returns/sales-list',
    component: SalesReturnListComponent,
    canActivate: [authGuard]
  },
  {
    path: 'returns/po-approval',
    component: AdminPoReturnsApprovalComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'distributor/po-returns',
    component: DistributorPoReturnsComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'approvals',
    component: ApprovalsComponent,
    canActivate: [authGuard, managerGuard]
  },
  {
    path: 'payment-tracking',
    component: ManagerDashboardComponent,
    canActivate: [authGuard, managerGuard]
  },
  {
    path: 'dashboard',
    component: AdminDashboardComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'distributor-dashboard',
    component: DistributorDashboardComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'users',
    component: UserMasterComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'distributors',
    component: UserMasterComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'internal-users',
    component: InternalUserMasterComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'categories',
    component: CategoryMasterComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'reports',
    component: ReportsComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'ledger',
    component: DistributorLedgerComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'inventory',
    component: InventoryMasterComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'inventory-v2',
    component: InventoryEnterpriseComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'payment-management',
    component: PaymentRequestsAdminComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'in-ward',
    component: InWardComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'grn/create/:id',
    component: GrnCreateComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'grn/detail/:id',
    component: GrnDetailComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'admin/payment-entries',
    component: AdminPaymentEntriesListComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/payment-entries/create',
    component: AdminPaymentEntriesFormComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'admin/payment-entries/:id',
    component: AdminPaymentEntriesDetailComponent,
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'my-payments',
    component: AdminPaymentEntriesListComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'my-payments/create',
    component: AdminPaymentEntriesFormComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'my-payments/:id',
    component: AdminPaymentEntriesDetailComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'product-trace',
    component: ProductTraceComponent,
    canActivate: [authGuard]
  },
  {
    path: 'quick-invoice',
    component: QuickInvoiceComponent,
    canActivate: [authGuard, distributorGuard]
  },
  {
    path: 'analytics',
    component: AnalyticsDashboardComponent,
    canActivate: [authGuard, adminGuard]
  },
  { path: '**', redirectTo: 'login' }
];
