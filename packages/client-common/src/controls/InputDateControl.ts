import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild
} from "@angular/core";
import {DateOnly} from "@simplism/core";
import {SdTypeValidate} from "@simplism/angular";

@Component({
  selector: "app-input-date",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <input type="text" [value]="yearValue" style="width:30px; border: none; background: white;"
             (input)="onInputYear($event)" [disabled]="disabled">
      /
      <input type="text" [value]="monthValue" style="width:20px; border: none; text-align: right; background: white;"
             (input)="onInputMonth($event)" [disabled]="disabled">
    </div>
  `
})
export class InputDateControl {

  @Input()
  public year?: number;

  @Input()
  public month?: number;

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Output()
  public readonly monthChange = new EventEmitter<number>();

  @Output()
  public readonly yearChange = new EventEmitter<number>();

  @ViewChild("input")
  public inputElRef?: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

  public get yearValue(): number {
    return this.year === undefined ? new DateOnly().year : this.year;
  }

  public get monthValue(): number {
    return this.month === undefined ? 1 : (this.month > 12 || this.month < 1) ? 12 : this.month;
  }

  public onInputYear(event: Event): void {
    const inputEl = event.target as (HTMLInputElement | HTMLTextAreaElement);

    this.year = Number(inputEl.value);
    this.yearChange.emit(this.year);
  }

  public onInputMonth(event: Event): void {
    const inputEl = event.target as (HTMLInputElement | HTMLTextAreaElement);

    this.month = Number(inputEl.value);
    this.monthChange.emit(this.month);
  }
}
