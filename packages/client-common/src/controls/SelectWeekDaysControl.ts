import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output} from "@angular/core";
import {
  ISdNotifyPropertyChange, SdNotifyPropertyChange,
  SdOrmProvider,
  SdTypeValidate
} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";

@Component({
  selector: "app-select-week-days-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-select [(value)]="value"
               [disabled]="disabled"
               [required]="required">
      <sd-select-item [value]="item.day" *ngFor="let item of dayList; trackBy: trackByIdFn">
        {{ item.day }}
      </sd-select-item>
    </sd-select>
  `
})
export class SelectWeekDaysControl implements ISdNotifyPropertyChange {
  @Input()
  public year?: number;

  @Input()
  public month?: number;

  @Input()
  public week?: number;

  @Input()
  @SdTypeValidate(Number)
  @SdNotifyPropertyChange()
  public value?: number;

  @Input()
  @SdTypeValidate(Boolean)
  public required?: boolean;

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Input()
  @SdTypeValidate(Array)
  public dayList?: IGetWeekDayVM[] = [];

  @Output()
  public readonly valueChange = new EventEmitter<any>();

  @Output()
  public readonly selectedItemChange = new EventEmitter<IGetWeekDayVM | undefined>();

  public busy?: boolean;

  public planDateList: {
    year: number;
    month: number;
    week: number;
    startDate: number;
    endDate: number;
  }[] = [];

  public trackByIdFn = (index: number, item: IGetWeekDayVM) => {
    return item.day;
  };

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async sdOnPropertyChange(propertyName: string, oldValue: any, newValue: any): Promise<void> {
    if (propertyName === "value" && newValue) {
      const value = newValue as number;

      this.dayList = this.dayList || [];
      const hasNotExistsId = !this.dayList.some(item1 => item1.day === value);

      if (this.year && this.month && this.week && hasNotExistsId) {
        await this._productionPlanCalculation();
      }
      this._cdr.markForCheck();
    }
  }

  private async _productionPlanCalculation(): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {
      const firstWeek = (await db.executeAsync([
        `SELECT CONVERT(varchar(10), (DATEADD(dd, @@DATEFIRST - DATEPART(dw, '${this.year}-${this.month}-01'), '${this.year}-${this.month}-01')), 121) AS endDay`
      ])).single();
      this.planDateList = [];

      const day = String(firstWeek![0].endDay).split("-");
      this.planDateList.push({
        year: this.year!,
        month: this.month!,
        week: 1,
        startDate: 1,
        endDate: Number(day[2])
      });

      let firstDay = Number(day[2]) + 1;
      let lastDay = firstDay + 6;

      for (let i = 2; i <= 5; i++) {
        this.planDateList.push({
          year: this.year!,
          month: this.month!,
          week: i,
          startDate: firstDay,
          endDate: lastDay
        });

        firstDay += 7;
        lastDay += 7;
      }
    });
    const monthLastDay = new Date(this.year!, this.month!, 0).getDate();

    const startDay = this.planDateList.some(item => item.week === this.week)
      ? this.planDateList.filter(item => item.week === this.week).single()!.startDate > monthLastDay
        ? monthLastDay : this.planDateList.filter(item => item.week === this.week).single()!.startDate : undefined;
    const endDate = this.planDateList.some(item => item.week === this.week)
      ? this.planDateList.filter(item => item.week === this.week).single()!.endDate > monthLastDay
        ? monthLastDay : this.planDateList.filter(item => item.week === this.week).single()!.endDate : undefined;

    this.dayList = [];
    for (let i = startDay!; i <= endDate!; i++) {
      this.dayList.push({
        day: i
      });
    }

    this.value = this.dayList.some(item => item.day === this.value) ? this.value : this.dayList[0].day;

    this._cdr.markForCheck();
  }

}

interface IGetWeekDayVM {
  day: number;
}