import { Component, inject, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { GlobalSearchComponent } from './components/shared/global-search.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, GlobalSearchComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'order-management-frontend';

  auth = inject(AuthService);
  router = inject(Router);

  // Controls sidebar visibility (mobile and desktop)
  sidebarOpen = signal(true);

  // Controls menu expansions - default expanded
  salesMenuOpen = signal(true);
  purchaseMenuOpen = signal(true);
  grnMenuOpen = signal(true);
  mastersMenuOpen = signal(true);
  reportsMenuOpen = signal(true);
  paymentMenuOpen = signal(true);

  // Track inner width for responsive behavior
  innerWidth = window.innerWidth;
  windowInnerWidth = signal(window.innerWidth);

  ngOnInit() {
    // Automatically close sidebar when navigating on mobile
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Only close on mobile/tablet
        if (window.innerWidth < 768) {
          this.sidebarOpen.set(false);
        }
      });

    // Listen for window resize
    window.addEventListener('resize', () => {
      this.innerWidth = window.innerWidth;
    });
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  closeSidebarIfMobile() {
    // Only close sidebar on mobile/tablet, not on desktop
    if (window.innerWidth < 768) {
      this.sidebarOpen.set(false);
    }
  }

  toggleSalesMenu() {
    this.salesMenuOpen.update((v) => !v);
  }

  togglePurchaseMenu() {
    this.purchaseMenuOpen.update((v) => !v);
  }

  toggleGrnMenu() {
    this.grnMenuOpen.update((v) => !v);
  }

  toggleMastersMenu() {
    this.mastersMenuOpen.update((v) => !v);
  }

  toggleReportsMenu() {
    this.reportsMenuOpen.update((v) => !v);
  }

  togglePaymentMenu() {
    this.paymentMenuOpen.update((v) => !v);
  }

  // Keep for backward compatibility
  toggleMasterMenu() {
    this.mastersMenuOpen.update((v) => !v);
  }

  logout() {
    this.auth.logout();
  }

  isActive(url: string): boolean {
    return this.router.isActive(url, false);
  }
}
