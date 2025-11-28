import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth';
import { RecipeService } from '../services/recipe';

@Component({
  selector: 'app-add-recipe',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-recipe.html',
  styles: [`
    .custom-green-btn { background-color: #2c7a38; color: white; }
    .custom-green-btn:hover { background-color: #215c2b; }
    .btn-outline-green { color: #2c7a38; border-color: #2c7a38; }
    .btn-outline-green:hover { background-color: #2c7a38; color: white; }
  `]
})
export class AddRecipe implements OnInit {
  private authService = inject(AuthService);
  private recipeService = inject(RecipeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  // 表单数据模型
  recipeData: any = {
    title: '',
    description: '',
    image: 'https://via.placeholder.com/556x370?text=My+Delicious+Food', 
    servings: 2,
    prepTime: 15,
    cookTime: 15,
    ingredients: [''], 
    instructions: [''], 
    isPublic: false,
    
    // Nutrition
    calories: null,
    protein: null,
    fat: null,
    carbs: null,

    // === 新增：饮食标签 (Dietary Tags) ===
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false
  };

  isEditMode = false;
  recipeId: string | null = null;

  constructor() {
    if (!this.authService.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    this.recipeId = this.route.snapshot.paramMap.get('id');
    
    if (this.recipeId) {
      this.isEditMode = true;
      this.loadRecipeForEdit(this.recipeId);
    }
  }

  loadRecipeForEdit(id: string) {
    this.recipeService.getCustomRecipeById(id).subscribe(recipe => {
      if (recipe) {
        this.recipeData = { ...recipe };
        
        // 数组防空处理
        if (!this.recipeData.ingredients || this.recipeData.ingredients.length === 0) this.recipeData.ingredients = [''];
        if (!this.recipeData.instructions || this.recipeData.instructions.length === 0) this.recipeData.instructions = [''];

        // 营养数据回显
        if (recipe.nutrition && recipe.nutrition.nutrients) {
          const nutrients = recipe.nutrition.nutrients;
          const cal = nutrients.find((n: any) => n.name === 'Calories');
          const pro = nutrients.find((n: any) => n.name === 'Protein');
          const fat = nutrients.find((n: any) => n.name === 'Fat');
          const carb = nutrients.find((n: any) => n.name === 'Carbohydrates');

          this.recipeData.calories = cal ? cal.amount : null;
          this.recipeData.protein = pro ? pro.amount : null;
          this.recipeData.fat = fat ? fat.amount : null;
          this.recipeData.carbs = carb ? carb.amount : null;
        }

        // 饮食标签会自动回显，因为它们直接就在 recipe 对象的第一层

        this.cdr.detectChanges();
      }
    });
  }

  addIngredient() { this.recipeData.ingredients.push(''); }
  removeIngredient(index: number) { if (this.recipeData.ingredients.length > 1) this.recipeData.ingredients.splice(index, 1); }
  addInstruction() { this.recipeData.instructions.push(''); }
  removeInstruction(index: number) { if (this.recipeData.instructions.length > 1) this.recipeData.instructions.splice(index, 1); }
  trackByIndex(index: number, obj: any): any { return index; }

  onSubmit() {
    const user = this.authService.currentUser();
    if (!user) return;

    // 构造营养对象
    const nutritionObj = {
      nutrients: [
        { name: 'Calories', amount: this.recipeData.calories || 0, unit: 'kcal' },
        { name: 'Protein', amount: this.recipeData.protein || 0, unit: 'g' },
        { name: 'Fat', amount: this.recipeData.fat || 0, unit: 'g' },
        { name: 'Carbohydrates', amount: this.recipeData.carbs || 0, unit: 'g' }
      ]
    };

    const recipeToSave = {
      ...this.recipeData,
      ingredients: this.recipeData.ingredients.filter((i: string) => i.trim() !== ''),
      instructions: this.recipeData.instructions.filter((i: string) => i.trim() !== ''),
      totalTime: this.recipeData.prepTime + this.recipeData.cookTime,
      readyInMinutes: this.recipeData.prepTime + this.recipeData.cookTime,
      userId: user.id,
      updatedAt: new Date().toISOString(),
      nutrition: nutritionObj
      // vegetarian, vegan 等字段已经在 this.recipeData 里了，会自动 spread 进去
    };

    // 清理临时字段
    delete recipeToSave.calories;
    delete recipeToSave.protein;
    delete recipeToSave.fat;
    delete recipeToSave.carbs;

    if (this.isEditMode && this.recipeId) {
      this.recipeService.updateCustomRecipe(this.recipeId, recipeToSave).subscribe({
        next: () => this.router.navigate(['/profile'], { queryParams: { tab: 'custom' } }),
        error: (err) => console.error('Update failed', err)
      });
    } else {
      recipeToSave.createdAt = new Date().toISOString();
      this.recipeService.addCustomRecipe(recipeToSave).subscribe({
        next: () => this.router.navigate(['/profile'], { queryParams: { tab: 'custom' } }),
        error: (err) => console.error('Create failed', err)
      });
    }
  }
}