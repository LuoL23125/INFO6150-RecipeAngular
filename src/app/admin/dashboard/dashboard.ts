import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth';
import { RecipeService } from '../../services/recipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styles: [`
    .admin-header { background: #343a40; color: white; }
    .table-responsive { box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; }
    .action-btn { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
    .nav-pills .nav-link { color: #6c757d; cursor: pointer; font-weight: bold; }
    .nav-pills .nav-link.active { background-color: #343a40; color: white; }
    
    /* Stats Card Styles */
    .stats-card { border: none; border-radius: 12px; transition: transform 0.2s; color: white; }
    .stats-card:hover { transform: translateY(-5px); }
    .bg-users { background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%); }
    .bg-favs { background: linear-gradient(135deg, #ff9966 0%, #ff5e62 100%); }
    .bg-plans { background: linear-gradient(135deg, #f09819 0%, #edde5d 100%); }
    .bg-top { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
  `]
})
export class Dashboard implements OnInit {
  public authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private cdr = inject(ChangeDetectorRef);
  
  users: any[] = [];
  reviews: any[] = [];
  currentUser: any = null;
  activeTab = 'users';

  // Stats Data
  stats = {
    totalUsers: 0,
    totalFavorites: 0,
    totalMealPlans: 0,
    mostReviewedRecipe: 'Calculating...'
  };

  ngOnInit() {
    this.currentUser = this.authService.currentUser();
    this.loadAllData();
  }

  loadAllData() {
    forkJoin({
      users: this.authService.getAllUsers(),
      reviews: this.recipeService.getAllReviews(),
      favorites: this.recipeService.getAllFavorites(),
      plans: this.recipeService.getAllMealPlans()
    }).subscribe({
      next: (data) => {
        this.users = data.users;
        this.reviews = data.reviews;

        this.stats.totalUsers = data.users.length;
        this.stats.totalFavorites = data.favorites.length;
        this.stats.totalMealPlans = data.plans.length;

        this.calculateMostReviewed(data.reviews);

        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load dashboard data', err)
    });
  }

  calculateMostReviewed(reviews: any[]) {
    if (reviews.length === 0) {
      this.stats.mostReviewedRecipe = 'No reviews yet';
      return;
    }

    const counts: { [key: string]: number } = {};
    let maxId = '';
    let maxCount = 0;

    reviews.forEach(r => {
      const id = String(r.recipeId);
      counts[id] = (counts[id] || 0) + 1;
      if (counts[id] > maxCount) {
        maxCount = counts[id];
        maxId = id;
      }
    });

    if (maxId) {
      // 1. 如果是 Custom Recipe
      if (maxId.startsWith('custom-')) {
        const realId = maxId.replace('custom-', '');
        this.recipeService.getCustomRecipeById(realId).subscribe(r => {
          this.stats.mostReviewedRecipe = r ? r.title : 'Unknown Custom Recipe';
          this.cdr.detectChanges();
        });
      } else {
        // 2. 如果是 API Recipe
        this.recipeService.getRecipeById(maxId).subscribe({
          next: (r) => {
            this.stats.mostReviewedRecipe = r.title;
            this.cdr.detectChanges();
          },
          error: () => {
            // === 修复重点：API 失败时，尝试查本地缓存 ===
            console.warn('Dashboard: API 失败，尝试本地缓存查找 ID:', maxId);
            this.recipeService.getLocalRecipeById(maxId).subscribe({
              next: (localR) => {
                if (localR) {
                  this.stats.mostReviewedRecipe = localR.title;
                } else {
                  this.stats.mostReviewedRecipe = 'Unknown Recipe (ID: ' + maxId + ')';
                }
                this.cdr.detectChanges();
              }
            });
          }
        });
      }
    }
  }

  setTab(tab: string) { this.activeTab = tab; }

  toggleAdmin(user: any) {
    if (user.id === this.currentUser?.id) { alert("You cannot change your own role."); return; }
    const newStatus = !user.isAdmin;
    const action = newStatus ? 'promote' : 'revoke';
    if (confirm(`Are you sure you want to ${action} admin privileges for ${user.name}?`)) {
      this.authService.updateUserRole(user.id, newStatus).subscribe({
        next: () => { user.isAdmin = newStatus; this.cdr.detectChanges(); },
        error: () => alert('Failed to update role.')
      });
    }
  }

  deleteUser(user: any) {
    if (user.id === this.currentUser?.id) { alert("You cannot delete yourself!"); return; }
    if (confirm(`WARNING: This will delete ${user.name} AND all their data. Proceed?`)) {
      this.authService.deleteUserAndData(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.loadAllData(); 
          alert('User deleted successfully.');
        },
        error: () => alert('Failed to delete user.')
      });
    }
  }

  deleteReview(review: any) {
    if (confirm('Are you sure you want to delete this review?')) {
      this.recipeService.deleteReview(review.id).subscribe({
        next: () => {
          this.reviews = this.reviews.filter(r => r.id !== review.id);
          this.calculateMostReviewed(this.reviews); 
          this.cdr.detectChanges();
        },
        error: () => alert('Failed to delete review.')
      });
    }
  }
}