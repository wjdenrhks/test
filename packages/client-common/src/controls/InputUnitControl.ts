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
  selector: "app-input-unit",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input type="text" [value]="getValue ? getValue : ''"
           style="border-bottom-color: darkgray; border-right: none; border-left: none; border-top: none;  text-align: right; background: white;"
           [style.width.px]="getWidth"
           (input)="onInputInput($event)"
           [disabled]="disabled">
    &nbsp;
    <input type="text" [value]="getUnit ? getUnit : ''" style="width:25px; border: none; background: white;" disabled>
  `
})
export class InputUnitControl {

  @Input()
  public value?: number | string;

  @Input()
  public unit?: string;

  @Input()
  public width?: number;

  @Input()
  public type?: "number" | "text" = "number";

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Output()
  public readonly valueChange = new EventEmitter<number | string>();

  @ViewChild("input")
  public inputElRef?: ElementRef<HTMLInputElement | HTMLTextAreaElement>;

  public get getValue(): number | string | undefined {
    return this.value === undefined ? ""
      : this.type === "number" && typeof this.value === "number" ? this.value.toLocaleString()
        : this.value;
  }

  public get getUnit(): string | undefined {
    return this.unit === undefined ? undefined : this.unit;
  }

  public get getWidth(): number | undefined {
    return this.width !== undefined ? this.width : 55;
  }

  public onInputInput(event: Event): void {
    const inputEl = event.target as (HTMLInputElement | HTMLTextAreaElement);
    let value;

    if (this.type === "number") {
      value = !inputEl.value ? undefined : Number(inputEl.value.replace(/,/g, ""));
    }
    else {
      value = inputEl.value;
    }

    if (this.value !== value) {
      this.value = value;
      this.valueChange.emit(this.value);
    }
  }
}
