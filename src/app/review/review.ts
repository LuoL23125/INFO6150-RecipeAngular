import { Component, Input, inject, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { RecipeService } from '../services/recipe';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './review.html',
  styles: [`
    .star-rating i { cursor: pointer; color: #ddd; transition: color 0.2s; }
    .star-rating i.filled { color: #ffc107; } 
    .avatar-small { width: 40px; height: 40px; background-color: #ff6b00; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; }
    .review-card { border-bottom: 1px solid #eee; }
    .review-card:last-child { border-bottom: none; }
  `]
})
export class Review implements OnInit, OnChanges {
  @Input() recipeId!: string | number;

  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  reviews: any[] = [];
  user: any = null;
  
  // 如果用户已经评论过，这个变量会保存那条评论
  userReview: any = null;

  newReview = {
    rating: 0,
    comment: ''
  };

  ngOnInit() {
    this.user = this.authService.currentUser();
    if (this.recipeId) {
      this.loadReviews();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['recipeId'] && !changes['recipeId'].firstChange) {
      this.loadReviews();
    }
  }

  loadReviews() {
    this.recipeService.getReviews(this.recipeId).subscribe({
      next: (data) => {
        this.reviews = data;
        
        // === 关键逻辑：检查当前用户是否已评论 ===
        if (this.user) {
          const myReview = this.reviews.find(r => String(r.userId) === String(this.user.id));
          if (myReview) {
            this.userReview = myReview;
            // 自动回显数据到表单
            this.newReview = {
              rating: myReview.rating,
              comment: myReview.comment
            };
          } else {
            this.userReview = null;
            this.newReview = { rating: 0, comment: '' };
          }
        }
        
        this.cdr.detectChanges();
      }
    });
  }

  setRating(stars: number) {
    this.newReview.rating = stars;
  }

  submitReview() {
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.newReview.rating === 0) {
      alert('Please select a star rating.');
      return;
    }

    const reviewData = {
      recipeId: this.recipeId,
      userId: this.user.id,
      userName: `${this.user.firstName} ${this.user.lastName}`,
      rating: this.newReview.rating,
      comment: this.newReview.comment,
      createdAt: new Date().toISOString()
    };

    // === 分支逻辑：更新 vs 新增 ===
    if (this.userReview) {
      // 1. 更新现有评论
      this.recipeService.updateReview(this.userReview.id, reviewData).subscribe({
        next: (updatedReview) => {
          // 更新数组中的那一条数据
          const index = this.reviews.findIndex(r => r.id === updatedReview.id);
          if (index !== -1) {
            this.reviews[index] = updatedReview;
          }
          alert('Your review has been updated!');
          this.cdr.detectChanges();
        },
        error: () => alert('Failed to update review.')
      });
    } else {
      // 2. 新增评论
      this.recipeService.addReview(reviewData).subscribe({
        next: (savedReview) => {
          this.reviews.unshift(savedReview);
          // 标记为已评论，防止重复提交
          this.userReview = savedReview;
          this.cdr.detectChanges();
        },
        error: () => alert('Failed to post review.')
      });
    }
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  get starsArray() {
    return [1, 2, 3, 4, 5];
  }
}