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
    /* 修复 input-group 圆角问题 */
    .input-group > .form-floating > .form-control { border-top-right-radius: 0; border-bottom-right-radius: 0; }
    .input-group-text { background-color: white; border-left: 0; cursor: pointer; }
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

  confirmPassword = '';
  errorMessage = '';

  // 新增：两个控制变量
  showPassword = false;
  showConfirmPassword = false;

  onSubmit() {
    if (this.formData.password !== this.confirmPassword) {
      this.errorMessage = "Passwords do not match!";
      return;
    }

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