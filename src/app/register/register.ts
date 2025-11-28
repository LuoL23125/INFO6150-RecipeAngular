import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styles: [`
    .form-signup { max-width: 500px; padding: 20px; margin: auto; }
    .custom-green-btn { background-color: #2c7a38; color: white; }
    .custom-green-btn:hover { background-color: #215c2b; }
  `]
})
export class Register {
  private authService = inject(AuthService);
  private router = inject(Router);

  formData = {
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  };

  // 新增：确认密码字段
  confirmPassword = '';
  errorMessage = '';

  onSubmit() {
    // 1. 验证密码是否匹配
    if (this.formData.password !== this.confirmPassword) {
      this.errorMessage = "Passwords do not match!";
      return;
    }

    // 2. 清除错误并提交
    this.errorMessage = '';
    
    this.authService.register(this.formData).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Register failed', err);
        this.errorMessage = 'Registration failed. Please try again.';
      }
    });
  }
}