import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from "@angular/core";
import {SdTypeValidate} from "@simplism/angular";

@Component({
  selector: "app-input-error",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    ±
    <input type="text" [value]="gspceValue ? gspceValue : ''" style="width:30px; border: none; text-align: right; background: white;"
           (input)="onInputGspce($event)" [disabled]="disabled">
    g&nbsp;±
    <input type="text" [value]="uspceValue ? uspceValue : ''" style="width:30px; border: none; text-align: right; background: white"
           (input)="onInputUspce($event)" [disabled]="disabled">

    ㎛
  `
})
export class InputErrorControl {

  @Input()
  public gspec?: number;

  @Input()
  public uspec?: number;

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Output()
  public readonly gspecChange = new EventEmitter<number>();

  @Output()
  public readonly uspecChange = new EventEmitter<number>();

  @ViewChild("input")
  public inputElRef?: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

  public get gspceValue(): number | undefined {
    return this.gspec === undefined ? undefined : this.gspec;
  }

  public get uspceValue(): number | undefined {
    return this.uspec === undefined ? undefined : this.uspec;
  }

  public onInputGspce(event: Event): void {
    const inputEl = event.target as (HTMLInputElement | HTMLTextAreaElement);

    this.gspec = Number(inputEl.value);
    this.gspecChange.emit(this.gspec);
  }

  public onInputUspce(event: Event): void {
    const inputEl = event.target as (HTMLInputElement | HTMLTextAreaElement);

    this.uspec = Number(inputEl.value);
    this.uspecChange.emit(this.uspec);
  }
}
