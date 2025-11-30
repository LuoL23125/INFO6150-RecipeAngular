import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styles: [`
    .form-signin { max-width: 400px; padding: 15px; margin: auto; }
    .custom-green-btn { background-color: #2c7a38; color: white; }
    .custom-green-btn:hover { background-color: #215c2b; }
    /* 修复 input-group 圆角问题 */
    .input-group > .form-floating > .form-control { border-top-right-radius: 0; border-bottom-right-radius: 0; }
    .input-group-text { background-color: white; border-left: 0; cursor: pointer; }
  `]
})
export class Login {
  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  
  // 新增：控制密码显示状态
  showPassword = false;

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (!this.email || !this.password) return;

    this.authService.login(this.email, this.password).subscribe({
      next: (isLoggedIn) => {
        if (isLoggedIn) {
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Invalid email or password';
        }
      },
      error: () => this.errorMessage = 'Login failed. Please try again.'
    });
  }
}