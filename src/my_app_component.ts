/// <reference path="../typings/angular2/angular2.d.ts" />
/// <reference path="../node_modules/immutable/dist/immutable.d.ts" />

import {Component, View, ON_PUSH, coreDirectives} from "angular2/angular2";
import {Injectable} from "angular2/di";
import {List, Record} from "immutable";

interface Item {
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
    this.columns = this.columns.updateIn([columnIndex, 'items'], items => items.splice(index, 0, item));
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
    <button (click)="move()">Move</button>
  `
})
export class ItemCmp {
  item: Item;
  constructor(public actions:ItemActions){}
  
  remove() { this.actions.removeItem(this.item); }
  move() { this.actions.moveItem(this.item, 1, null); }
}

@Component({
  selector: 'column',
  changeDetection: ON_PUSH,
  properties: {
    column: 'column'
  }
})
@View({
  directives: [coreDirectives, ItemCmp] ,
  template: `
    <h1>{{column.name}}</h1>
    <item *ng-for="#i of column.items" [item]="i"></item>
  `
})
export class ColumnCmp {
  column: Column;
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
  injectables: [BoardStore, ItemActions]
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