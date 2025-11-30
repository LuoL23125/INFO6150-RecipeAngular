import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styles: [`
    .admin-header { background: #343a40; color: white; }
    .table-responsive { box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; }
    .action-btn { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
  `]
})
export class Dashboard implements OnInit {
  public authService = inject(AuthService); // public 供 HTML 使用
  private cdr = inject(ChangeDetectorRef);
  
  users: any[] = [];
  currentUser: any = null;

  ngOnInit() {
    this.currentUser = this.authService.currentUser();
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }

  // 1. 切换管理员权限
  toggleAdmin(user: any) {
    // 防止取消自己的管理员权限
    if (user.id === this.currentUser?.id) {
      alert("You cannot change your own role.");
      return;
    }

    const newStatus = !user.isAdmin;
    const action = newStatus ? 'promote' : 'revoke';

    if (confirm(`Are you sure you want to ${action} admin privileges for ${user.name}?`)) {
      this.authService.updateUserRole(user.id, newStatus).subscribe({
        next: () => {
          user.isAdmin = newStatus; // 本地更新，无需刷新列表
          this.cdr.detectChanges();
        },
        error: () => alert('Failed to update role.')
      });
    }
  }

  // 2. 删除用户
  deleteUser(user: any) {
    if (user.id === this.currentUser?.id) {
      alert("You cannot delete yourself!");
      return;
    }

    if (confirm(`WARNING: This will delete ${user.name} AND all their recipes, reviews, and plans. This cannot be undone. Proceed?`)) {
      this.authService.deleteUserAndData(user.id).subscribe({
        next: () => {
          // 从本地数组移除
          this.users = this.users.filter(u => u.id !== user.id);
          this.cdr.detectChanges();
          alert('User deleted successfully.');
        },
        error: (err) => {
          console.error(err);
          alert('Failed to delete user.');
        }
      });
    }
  }
}