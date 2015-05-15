/// <reference path="../typings/angular2/angular2.d.ts" />
/// <reference path="../node_modules/immutable/dist/immutable.d.ts" />

import {Component, View, ON_PUSH, coreDirectives} from "angular2/angular2";
import {Injectable} from "angular2/di";
import {List, Record, Map} from "immutable";

interface Item extends Map<string, any> {
  text:string
  columnId:number;
}
var ItemRecord = Record({text:null, columnId:null});
function item(text:string, columnId:number):Item {
  return <any>new ItemRecord({text, columnId});
}


interface Column {
  id:number;
  name:string;
  items:List<Item>;
}
var ColumnRecord = Record({id:null, name:null, items:null});
function column(id:number, name:string, items:List<Item>):Column {
  return <any>new ColumnRecord({id, name, items});
}


class BoardStore {
  public columns: List<Column>;
  
  constructor() {
    this.columns = List.of(
      column(1, "todo",         List.of(item('todo:one', 1), item('todo:two', 1))),
      column(2, "in-progress",  List.of(item('in-progress:one', 2), item('in-progress:two', 2))),
      column(3, "done",         List.of(item('done:one', 3), item('done:two', 3)))
    );
  }
  
  removeItem(item: Item) {
    const columnIndex = this.columns.findIndex(c => c.id === item.columnId);
    const itemIndex = this.columns.get(columnIndex).items.indexOf(item);
    this.columns = this.columns.removeIn([columnIndex, 'items', itemIndex]);
  }
  
  moveItem(item: Item, destinationColumnId: number, insertAfter: Item) {
    console.assert(insertAfter === null || insertAfter.columnId === destinationColumnId);

    const targetColumn = this.columns.filter(c => c.id === destinationColumnId).first();
    const index = insertAfter === null ? 0 : targetColumn.items.indexOf(insertAfter);
     
    this.removeItem(item);
    this.addItem(item, destinationColumnId, index);
  }
  
  private addItem(item: Item, destinationColumnId: number, index: number) {
    const columnIndex = this.columns.findIndex(c => c.id === destinationColumnId);
    const newItem = item.setIn(['columnId'], destinationColumnId);
    this.columns = this.columns.updateIn([columnIndex, 'items'], items => items.splice(index, 0, newItem));
  }
}


@Injectable()
class ItemActions {
  constructor(private board:BoardStore) {}
  
  removeItem(item: Item) { this.board.removeItem(item); }
  moveItem(item: Item, destinationColumndId:number, insertAfter:Item) { 
    this.board.moveItem(item, destinationColumndId, insertAfter); 
  }
}

@Injectable()
class DragService {
  _draggingItem: Item = null;
  _draggingOver: Item = null;
  _draggingOverColumn: number = null;
  constructor(public actions: ItemActions) {}
  
  setDragging(item: Item) {
    //console.log(item);
    this._draggingItem = item;
  }
  
  dragOver(columnId: number, item: Item) {
    console.log('over', columnId, item);
    if (this._draggingItem == null) {
      return;
    }
    this._draggingOver = item;
    this._draggingOverColumn = columnId;
  }
  
  dragEnd() {
    if (this._draggingItem == null || this._draggingOverColumn == null) return;
    this.actions.moveItem(this._draggingItem, this._draggingOverColumn, this._draggingOver);
    this._draggingItem = null;
    this._draggingOver = null;
    this._draggingOverColumn = null;
  }
} 

@Component({
  selector: 'item',
  changeDetection: ON_PUSH,
  properties: {
    item: 'item'
  }
})
@View({
  template: `
    Item: {{item.text}}
    <button (click)="remove()">x</button>
  `
})
export class ItemCmp {
  item: Item;
  constructor(public actions:ItemActions){}
  
  remove() { this.actions.removeItem(this.item); }
  // move() { this.actions.moveItem(this.item, 1, null); }
}

@Component({
  selector: 'column',
  changeDetection: ON_PUSH,
  properties: {
    column: 'column'
  },
  hostListeners: {
    dragover: 'drag.dragOver(column.id, null)' 
  }
})
@View({
  directives: [coreDirectives, ItemCmp] ,
  template: `
    <h1>{{column.name}}</h1>
    <item *ng-for="#i of column.items" [item]="i" draggable="true"
       (dragstart)="drag.setDragging(i)" (dragend)="drag.dragEnd()" (dragover)="drag.dragOver(column.id, i)"></item>
  `
})
export class ColumnCmp {
  column: Column;
  constructor(public drag: DragService) {}
}

@Component({
  selector: 'board',
  changeDetection: ON_PUSH,
  properties: {
    columns: 'columns'
  }
})
@View({
  directives: [coreDirectives, ColumnCmp],
  template: `
    <h1>Kanban</h1>
    <column *ng-for="#c of columns" [column]="c"></column>
  `
})
export class BoardCmp {
  columns: List<Column>;
}

@Component({
  selector: 'my-app',
  injectables: [BoardStore, ItemActions, DragService]
})
@View({
  directives: [BoardCmp],
  template: '<board [columns]="board.columns"></board>'
})
export class KanbanApp {
  constructor(public board:BoardStore) {
    (<any>window).b = board;
  }
}