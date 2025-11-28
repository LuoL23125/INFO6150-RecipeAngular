import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.html',
  styleUrls: ['./nav.css']
})
export class Nav {
  public authService = inject(AuthService);
  
  // 控制下拉菜单的状态
  isDropdownOpen = false;

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  // 点击外部关闭菜单（这里简单处理，点击菜单项后自动关闭）
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  logout() {
    this.closeDropdown();
    this.authService.logout();
  }

  // 获取用户首字母 (例如 Lei Luo -> LL)
  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    
    // 如果有 firstName 和 lastName
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    // 如果只有 name
    else if (user.name) {
      return user.name.slice(0, 2).toUpperCase();
    }
    
    return 'U';
  }
}