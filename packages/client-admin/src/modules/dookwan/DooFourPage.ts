import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {DateOnly} from "@simplism/core";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";


@Component({
  selector: "app-doo-four",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>리와인더 현황</h4>

          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
        </sd-topbar>
        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'년'">
                <sd-select [(value)]="filter.year">
                  <sd-select-item *ngFor="let year of yearList; trackBy: trackByMeFn"
                                  [value]="year">
                    {{ year }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
                  <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                  조회
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount > 0">
            <sd-dock-container>
              <sd-dock class="sd-background-white sd-padding-sm-default"
                       style="padding-bottom: 20px;"
                       [position]="'top'"
                       *ngIf="items && items.length > 0 ">
                <h1> &nbsp; {{ lastFilter.year }}년도 월별 작업실적</h1>
                <br>
                <table class="sd-padding-xs-sm">
                  <thead>
                  <tr>
                    <th style="width: 5%;"> 구 분</th>
                    <th style="width: 13%;"> 작업 계획(M)</th>
                    <th style="width: 13%;"> 작업 실적(M)</th>
                    <th style="width: 13%;"> 실적율(%)</th>
                    <th style="width: 13%;"> 작업일수</th>
                    <th style="width: 13%;"> 일 평균수량(M)</th>
                    <th> 비고</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr *ngFor="let item of items; trackBy: trackByMeFn">
                    <td *ngIf="item.id !== 13">{{ item.id + "월" }}</td>
                    <td *ngIf="item.id === 13"> 누 계</td>
                    <td class="sd-padding-xs-sm">
                      {{ item.planQuantity | number }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.productionQuantity | number }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.productionPercent | number }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.workDay }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.dayAvg | number }}
                    </td>
                    <td *ngIf="item.id !== 13">
                      <sd-textfield [(value)]="item.remark"></sd-textfield>
                    </td>
                    <td *ngIf="item.id === 13"></td>
                  </tr>
                  </tbody>
                </table>
              </sd-dock>
              <sd-dock class="sd-background-white sd-padding-sm-default"
                       style="padding-top: 15px;"
                       *ngIf="prevItems && prevItems.length > 0 ">
                <h1> &nbsp; 전년대비 실적 </h1>
                <br>
                <table class="sd-padding-xs-sm">
                  <thead>
                  <tr>
                    <th style="width: 5%;"> 구 분</th>
                    <th style="width: 13%;"> 전년도 작업수량</th>
                    <th style="width: 13%;"> 당해년도 작업수량</th>
                    <th style="width: 13%;"> 증감율(%)</th>
                    <th style="width: 13%;"> 당해년도 목표수량</th>
                    <th style="width: 13%;"> 목표대비 증감율(%)</th>
                    <th> 비고</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr *ngFor="let item of prevItems; trackBy: trackByMeFn">
                    <td *ngIf="item.id !== 13">{{ item.id + "월" }}</td>
                    <td *ngIf="item.id === 13"> 누 계</td>
                    <td class="sd-padding-xs-sm">
                      {{ item.prevProductionQuantity | number }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.nowProductionQuantity | number }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.growthRate | number }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.planQuantity | number }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ item.targetContrastRate | number }}
                    </td>
                    <td *ngIf="item.id !== 13">
                      <sd-textfield [(value)]="item.remark"></sd-textfield>
                    </td>
                    <td *ngIf="item.id === 13"></td>
                  </tr>
                  </tbody>
                </table>
              </sd-dock>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class DooFourPage implements OnInit {

  public filter: IFilterVM = {
    year: undefined
  };

  public pagination = {page: 0, length: 0};

  public yearList = [] as number[];

  public lastFilter?: IFilterVM;

  public orgItems: IRewindStatusVM[] = [];
  public items: IRewindStatusVM[] = [];
  public orgPrevItems: IPrevInfoVM[] = [];
  public prevItems: IPrevInfoVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.filter.year = new DateOnly().year;

    for (let i = 2018; i <= this.filter.year + 1; i++) {
      this.yearList.push(i);
    }

    await this.onSearchFormSubmit();
    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.lastFilter = Object.clone(this.filter);

    await this._search();
    this._cdr.markForCheck();
  }

  @HostListener("document:keydown", ["$event"])
  public async onDocumentKeydown(event: KeyboardEvent): Promise<void> {
    if ((event.key === "s" || event.key === "S") && event.ctrlKey) {
      event.preventDefault();
      await this._save();
      this._cdr.markForCheck();
    }
  }

  public async onSaveButtonClick(): Promise<void> {
    await this._save();
    this._cdr.markForCheck();
  }

  private async _save(): Promise<void> {
    const diffItemsTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);
    const diffPrevItemsTargets = this.orgPrevItems.diffs(this.prevItems, {keyProps: ["id"]}).map(item => item.target!);


    console.log("@@@@@@@@@@@@@");
    console.log(diffItemsTargets);
    console.log(this.orgItems);
    console.log(this.items);

    if (diffItemsTargets.length < 1 && diffPrevItemsTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    this.viewBusyCount++;

    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        for (const item of diffItemsTargets) {
          const result = await db.rewindReport.where(item1 => [sorm.equal(item1.year, this.lastFilter!.year!), sorm.equal(item1.planType, true), sorm.equal(item1.month, item.id)]).singleAsync();

          if (!result) {
            db.rewindReport
              .insertPrepare({
                companyId: 1,
                planType: true,
                year: this.lastFilter!.year!,
                month: item.id!,
                remark: item.remark
              });
          }
          else {
            db.rewindReport
              .where(item1 => [
                sorm.equal(item1.year, this.lastFilter!.year!),
                sorm.equal(item1.planType, true),
                sorm.equal(item1.month, item.id)
              ])
              .updatePrepare(() => ({
                remark: item.remark
              }));
          }
        }

        for (const item of diffPrevItemsTargets) {
          const result = await db.rewindReport.where(item1 => [sorm.equal(item1.year, this.lastFilter!.year!), sorm.equal(item1.planType, false), sorm.equal(item1.month, item.id)]).singleAsync();

          if (!result) {
            db.rewindReport
              .insertPrepare({
                companyId: 1,
                planType: false,
                year: this.lastFilter!.year!,
                month: item.id!,
                remark: item.remark
              });
          }
          else {
            db.rewindReport
              .where(item1 => [
                sorm.equal(item1.year, this.lastFilter!.year!),
                sorm.equal(item1.planType, false),
                sorm.equal(item1.month, item.id)
              ])
              .updatePrepare(() => ({
                remark: item.remark
              }));
          }
        }

        await db.executePreparedAsync();

      });

      this._toast.success("저장되었습니다.");
      await this.onSearchFormSubmit();
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }


  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const nowFirstDate = new DateOnly(this.lastFilter!.year!, 1, 1);
        const nowLastDate = new DateOnly(this.lastFilter!.year!, 12, 31);

        this.items = [];
        this.prevItems = [];

        this.items = await this._getRewindProductInfo(db, nowFirstDate, nowLastDate);
        this.orgItems = Object.clone(this.items);

        const prevFirstDate = new DateOnly((this.lastFilter!.year! - 1), 1, 1);
        const prevLastDate = new DateOnly((this.lastFilter!.year! - 1), 12, 31);

        const prevItems = await this._getRewindProductInfo(db, prevFirstDate, prevLastDate);

        const result: IPrevInfoVM[] = [];
        for (let i = 0; i <= 12; i++) {
          if (i !== 12) {
            const prevProductionQuantity = (prevItems && prevItems.filter(item => item.id === (i + 1)).single()!.productionQuantity) || 0;


            const nowProductionQuantity = this.items && this.items.filter(item => item.id === (i + 1)).single()!.productionQuantity || 0;
            const growthRate = isNaN((nowProductionQuantity - prevProductionQuantity) / prevProductionQuantity) ? 0 :
              String((nowProductionQuantity - prevProductionQuantity) / prevProductionQuantity) === "Infinity" ? 0
                : Number((((nowProductionQuantity - prevProductionQuantity) / prevProductionQuantity) * 100).toFixed(2));
            const planQuantity = this.items && this.items.filter(item => item.id === (i + 1)).single()!.planQuantity || 0;
            const targetContrastRate = isNaN((planQuantity - nowProductionQuantity) / nowProductionQuantity) ? 0 :
              String((planQuantity - nowProductionQuantity) / nowProductionQuantity) === "Infinity" ? 0 : Number((((planQuantity - nowProductionQuantity) / nowProductionQuantity) * 100).toFixed(2));

            const remark = await this._getRewindProductRemark(db, (i + 1), true);


            result.push({
              id: i + 1,
              prevProductionQuantity,
              nowProductionQuantity,
              growthRate,
              planQuantity,
              targetContrastRate,
              remark
            });
          }
          else {
            const prevProductionQuantity = result.sum(item => item.prevProductionQuantity || 0) || 0;
            const nowProductionQuantity = result.sum(item => item.nowProductionQuantity || 0) || 0;
            const growthRate = isNaN((nowProductionQuantity - prevProductionQuantity) / prevProductionQuantity) ? 0 :
              String((nowProductionQuantity - prevProductionQuantity) / prevProductionQuantity) === "Infinity" ? 0 : Number((((nowProductionQuantity - prevProductionQuantity) / prevProductionQuantity) * 100).toFixed(2));
            const planQuantity = result.sum(item => item.planQuantity || 0) || 0;
            const targetContrastRate = isNaN((planQuantity - nowProductionQuantity) / nowProductionQuantity) ? 0 :
              String((planQuantity - nowProductionQuantity) / nowProductionQuantity) === "Infinity" ? 0 : Number((((planQuantity - nowProductionQuantity) / nowProductionQuantity) * 100).toFixed(2));

            result.push({
              id: i + 1,
              prevProductionQuantity,
              nowProductionQuantity,
              growthRate,
              planQuantity,
              remark: undefined,
              targetContrastRate
            });
          }
        }
        this.prevItems = Object.clone(result);
        this.orgPrevItems = Object.clone(this.prevItems);

        this._cdr.markForCheck();
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private async _getRewindProductInfo(db: MainDbContext, firstDate: DateOnly, lastDate: DateOnly): Promise<IRewindStatusVM[]> {
    // 기간별 작업 계획
    const planInfo = await db.rewindProcess
      .where(item => [
        sorm.equal(item.isCanceled, false),
        sorm.between(item.planDate, firstDate, lastDate)
      ])
      .groupBy(item => [
        sorm.query("DATEPART(MM, [TBL].planDate)", Number)
      ])
      .select(item => ({
        month: sorm.query("DATEPART(MM, [TBL].planDate)", Number),
        quantity: sorm.sum(sorm.ifNull(item.inputQuantity, 0))
      }))
      .resultAsync();

    // 기간별 작업 실적
    const productInfo = await db.rewindProcess
      .where(item => [
        sorm.equal(item.isCanceled, false),
        sorm.notNull(item.startDate),
        sorm.between(item.startDate!, firstDate, lastDate)
      ])
      .groupBy(item => [
        sorm.query("DATEPART(MM, [TBL].startDate)", Number)
      ])
      .select(item => ({
        month: sorm.query("DATEPART(MM, [TBL].startDate)", Number),
        quantity: sorm.sum(sorm.ifNull(item.productionQuantity, 0))
      }))
      .resultAsync();

    const result: IRewindStatusVM[] = [];
    for (let i = 0; i <= 12; i++) {
      if (i !== 12) {
        const productionQuantity = productInfo && productInfo.some(item => item.month === (i + 1)) ? productInfo.filter(item => item.month === (i + 1)).sum(item => item.quantity)! : 0;
        const planQuantity = planInfo && planInfo.some(item => item.month === (i + 1)) ? planInfo.filter(item => item.month === (i + 1)).sum(item => item.quantity)! : 0;
        const productionPercent = isNaN(productionQuantity / planQuantity) ? 0 :
          String((productionQuantity / planQuantity) * 100) === "Infinity" ? 0 : Number(((productionQuantity / planQuantity) * 100).toFixed(2));
        const workDay = await this._getProductionDays(db, (i + 1));
        const dayAvg = isNaN(productionPercent / workDay) ? 0 :
          String(productionPercent / workDay) === "Infinity" ? 0 : Number((productionPercent / workDay).toFixed(2));
        const remark = await this._getRewindProductRemark(db, (i + 1), false);

        result.push({
          id: i + 1,
          productionQuantity,
          productionPercent,
          workDay,
          dayAvg,
          remark,
          planQuantity
        });
      }
      else {
        const productionQuantity = result.sum(item => item.productionQuantity || 0) || 0;
        const planQuantity = result.sum(item => item.productionPercent || 0) || 0;
        const productionPercent = isNaN(productionQuantity / planQuantity) ? 0 :
          String((productionQuantity / planQuantity) * 100) === "Infinity" ? 0 : Number(((productionQuantity / planQuantity) * 100).toFixed(2));
        const workDay = result.sum(item => item.workDay || 0) || 0;
        const dayAvg = isNaN(productionPercent / workDay) ? 0 :
          String(productionPercent / workDay) === "Infinity" ? 0 : Number((productionPercent / workDay).toFixed(2));

        result.push({
          id: i + 1,
          productionQuantity,
          productionPercent,
          workDay,
          dayAvg,
          remark: undefined,
          planQuantity
        });
      }
    }

    return result;
  }

  private async _getProductionDays(db: MainDbContext, month: number): Promise<number> {
    const monthStr = this.lastFilter!.year + month.toString().padStart(2, "0") + "%";
    // 기간별 일수
    const productionDays = await db.rewindProcess
      .where(item => [
        sorm.equal(item.isCanceled, false),
        sorm.query(`CONVERT(VARCHAR(8), startDate, 112) like '${monthStr}'`, Boolean)!
      ])
      .groupBy(item => [
        sorm.query("DATEPART(dd, [TBL].startDate)", Number)
      ])
      .select(item => ({
        day: sorm.query("DATEPART(MM, [TBL].startDate)", Number)
      }))
      .countAsync();

    return productionDays || 0;
  }

  private async _getRewindProductRemark(db: MainDbContext, month: number, isPrev: boolean): Promise<string | undefined> {
    //목표실적
    if (isPrev) {
      const result = await db.rewindReport
        .where(item => [
          sorm.equal(item.planType, false),
          sorm.equal(item.year, this.lastFilter!.year),
          sorm.equal(item.month, month)
        ])
        .select(item => ({
          remark: item.remark
        }))
        .singleAsync();

      return result ? result.remark : undefined;
    }
    else {
      const result = await db.rewindReport
        .where(item => [
          sorm.equal(item.planType, true),
          sorm.equal(item.year, this.lastFilter!.year),
          sorm.equal(item.month, month)
        ])
        .select(item => ({
          remark: item.remark
        }))
        .singleAsync();

      return result ? result.remark : undefined;
    }

  }



}


interface IFilterVM {
  year?: number;
}

interface IRewindStatusVM {
  id: number | undefined;
  planQuantity: number | number;
  productionQuantity: number | undefined;
  productionPercent: number | undefined;
  workDay: number | undefined;
  dayAvg: number | undefined;
  remark: string | undefined;
}

interface IPrevInfoVM {
  id: number | undefined;
  prevProductionQuantity: number | undefined;
  nowProductionQuantity: number | undefined;
  growthRate: number | undefined;
  planQuantity: number | undefined;
  targetContrastRate: number | undefined;
  remark: string | undefined;
}
