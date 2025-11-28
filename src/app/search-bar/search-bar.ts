import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [],
  templateUrl: './search-bar.html',
  styleUrls: ['./search-bar.css']
})
export class SearchBar {
  // 定义一个事件发射器，把搜索词发给父组件
  @Output() search = new EventEmitter<string>();

  triggerSearch(term: string) {
    // 只有当输入不为空时才搜索
    if (term.trim()) {
      this.search.emit(term);
    }
  }
}