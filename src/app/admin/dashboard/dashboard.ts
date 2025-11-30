import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core'; // <--- 1. 引入 ChangeDetectorRef
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
  `]
})
export class Dashboard implements OnInit {
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef); // <--- 2. 注入它
  
  users: any[] = [];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        // <--- 3. 关键修复：强制刷新视图，数据回来立刻显示
        this.cdr.detectChanges(); 
      },
      error: (err) => console.error('Failed to load users', err)
    });
  }
}