import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {DateOnly} from "@simplism/core";
import {MainDbContext} from "@sample/main-database";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {sorm} from "@simplism/orm-query";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-good-scrap-status",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>제품별 스크랩 현황</h4>

          <sd-topbar-menu *ngIf="lastFilter && items" (click)="onDownloadButtonClick()">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
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
              <sd-form-item [label]="'월'">
                <sd-select [(value)]="filter.month">
                  <sd-select-item *ngFor="let month of monthList; trackBy: trackByMeFn"
                                  [value]="month">
                    {{ month }}
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
              <sd-dock class="sd-background-white sd-padding-sm-default" *ngIf="items && items.length > 0">
                <table class="_test">
                  <thead>
                  <tr>
                    <th class="sd-padding-sm-xs" style="text-align: center;"> NO</th>
                    <th class="sd-padding-sm-xs" style="text-align: center; width: 100px;"> 품명</th>
                    <ng-container *ngFor="let item of items[0].day; trackBy: trackByMeFn">
                      <th class="sd-padding-xs-sm"> {{ item.day + '일' }}</th>
                    </ng-container>
                    <th class="sd-padding-xs-sm" style="text-align: center;"> 소계</th>
                  </tr>
                  </thead>
                  <tbody *ngFor="let scrapItem of items; trackBy: trackByMeFn">
                  <tr>
                    <td class="sd-padding-xs-sm" *ngIf="!!scrapItem.seq">{{ scrapItem.seq }}</td>
                    <td class="sd-padding-xs-sm" style="width: 100px;"
                        *ngIf="!!scrapItem.seq">{{ scrapItem.goodName }}</td>
                    <td class="sd-padding-xs-sm" [colSpan]="2" *ngIf="!scrapItem.seq">소계</td>
                    <td class="sd-padding-xs-sm" *ngFor="let goodScrap of scrapItem.day">
                      {{ goodScrap.quantity | number }}
                    </td>
                    <td class="sd-padding-xs-sm">
                      {{ scrapItem.totalQuantity | number }}
                    </td>
                  </tr>
                  </tbody>

                </table>
              </sd-dock>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>

      </sd-topbar-container>
    </sd-busy-container>`,
  styles: [/* language=SCSS */ `
    ._test {
      border-collapse: collapse;
      border: 1px solid darkolivegreen;
      text-align: center;
      width: 100%;
      height: 100%;
    }

    thead {
      background: #EEEEEE;
    }

    th, td {
      border: 1px solid darkolivegreen;
      text-align: center;
    }

  `]
})
export class GoodScrapStatusPage implements OnInit {

  public filter: IFilterVM = {
    year: undefined,
    month: undefined
  };

  public lastFilter?: IFilterVM;

  public items?: IGoodScrapVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public yearList = [] as number[];
  public monthList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async ngOnInit(): Promise<void> {
    this.filter.year = new DateOnly().year;
    this.filter.month = new DateOnly().month;

    for (let i = 2018; i <= this.filter.year + 1; i++) {
      this.yearList.push(i);
    }
    this.mainBusyCount++;

    await this.onSearchFormSubmit();
    this.mainBusyCount--;

    this._cdr.markForCheck();
  }

  public async onDownloadButtonClick(): Promise<void> {
    await this._download();
    this._cdr.markForCheck();
  }

  private async _download(): Promise<void> {
    this.viewBusyCount++;
    try {

      if (!this.lastFilter!.year || !this.lastFilter!.month) {
        this._toast.danger("검색기간을 정확히 입력해 주세요.");
        return;
      }

      const year = this.filter.year;
      const month = this.filter.month;
      const lastDay = (new Date(Number(this.lastFilter!.year), Number(this.lastFilter!.month), 0)).getDate();

      const formatDate = (new DateOnly(Number(year), Number(month) + 1, 0)).toFormatString("yyyy-MM");

      const headerStyle = {
        alignH: "center",
        background: "CCCCCCCC",
        foreground: "FFFFFFFF",
        bold: true
      };

      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`제품별 스크랩 현황`);

      ws.cell(0, 0).merge(0, lastDay + 2); //+3은 NO, 품명, 소계
      ws.cell(0, 0).value = "제품별 스크랩 현황(" + formatDate + ")";
      ws.cell(1, 0).value = "NO";
      Object.assign(ws.cell(1, 0).style, headerStyle);
      ws.cell(1, 1).value = "품명";
      Object.assign(ws.cell(1, 1).style, headerStyle);

      for (let i = 1; i <= lastDay; i++) {
        ws.cell(1, 1 + i).value = i + "일";
        Object.assign(ws.cell(1, 1 + i).style, headerStyle);
      }
      ws.cell(1, lastDay + 2).value = "소계";
      Object.assign(ws.cell(1, lastDay + 2).style, headerStyle);

      //여기까지 첫줄 끝, 두번째 줄 시작

      let nowScrapSeq = 0;
      for (const nowScrapItem of this.items! || []) {  //세로
        if (nowScrapItem.seq !== undefined) {
          ws.cell(nowScrapSeq + 2, 0).value = nowScrapItem.seq;
          ws.cell(nowScrapSeq + 2, 1).value = nowScrapItem.goodName;
          let scrapSeq = 1;
          for (const nowScrapItem2 of nowScrapItem.day || []) {
            nowScrapItem2.quantity === Infinity ? ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = "∞"
              : isNaN(nowScrapItem2.quantity!) ? ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = undefined
              : ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = nowScrapItem2.quantity;
            scrapSeq++;
          }
          nowScrapItem.totalQuantity === Infinity ? ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = "∞"
            : isNaN(nowScrapItem.totalQuantity!) ? ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = undefined
            : ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = nowScrapItem.totalQuantity;
        }
        else {
          ws.cell(nowScrapSeq + 2, 0).merge(nowScrapSeq + 2, 1);
          ws.cell(nowScrapSeq + 2, 0).value = "소계";
          let scrapSeq = 1;
          for (const nowScrapItem2 of nowScrapItem.day || []) {
            nowScrapItem2.quantity === Infinity ? ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = "∞"
              : isNaN(nowScrapItem2.quantity!) ? ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = undefined
              : ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = nowScrapItem2.quantity;
            scrapSeq++;
          }
          nowScrapItem.totalQuantity === Infinity ? ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = "∞"
            : isNaN(nowScrapItem.totalQuantity!) ? ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = undefined
            : ws.cell(nowScrapSeq + 2, scrapSeq + 1).value = nowScrapItem.totalQuantity;
        }
        nowScrapSeq++;
      }

      const title = "제품별 스크랩 현황(" + formatDate + ").xlsx";

      await wb.downloadAsync(title);


    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {

        this.items = [];

        const lastDay = (new Date(Number(this.lastFilter!.year), Number(this.lastFilter!.month), 0)).getDate();
        const firstDate = new DateOnly(this.lastFilter!.year!, this.lastFilter!.month!, 1);
        const lastDate = new DateOnly(this.lastFilter!.year!, this.lastFilter!.month!, lastDay);

        const groupByGoodList = await db.scrap
          .include(item => item.production)
          .include(item => item.production!.goods)
          .where(item => [
            sorm.between(item.occurrenceDate, firstDate, lastDate)
          ])
          .groupBy(item => [
            item.production!.goodId,
            item.production!.goods!.name
          ])
          .orderBy(item => item.production!.goodId)
          .select(item => ({
            seq: sorm.query("ROW_NUMBER() OVER (ORDER BY [production].goodId ASC)", Number),
            goodId: item.production!.goodId,
            goodName: item.production!.goods!.name,
            totalQuantity: sorm.sum(item.weight)
          }))
          .resultAsync();

        const groupByScrapList = await db.scrap
          .include(item => item.production)
          .include(item => item.production!.goods)
          .where(item => [
            sorm.between(item.occurrenceDate, firstDate, lastDate)
          ])
          .groupBy(item => [
            sorm.query("DATEPART(dd, occurrenceDate)", Number),
            item.production!.goodId,
            item.production!.goods!.name
          ])
          .orderBy(item => item.production!.goodId)
          .orderBy(item => sorm.query("DATEPART(dd, occurrenceDate)", Number))
          .select(item => ({
            goodId: item.production!.goodId,
            goodName: item.production!.goods!.name,
            quantity: sorm.sum(item.weight),
            day: sorm.query("DATEPART(dd, occurrenceDate)", Number)
          }))
          .resultAsync();

        const groupByDateList = await db.scrap
          .where(item => [
            sorm.between(item.occurrenceDate, firstDate, lastDate)
          ])
          .groupBy(item => [
            sorm.query("DATEPART(dd, occurrenceDate)", Number)
          ])
          .orderBy(item => sorm.query("DATEPART(dd, occurrenceDate)", Number))
          .select(item => ({
            day: sorm.query("DATEPART(dd, occurrenceDate)", Number),
            quantity: sorm.sum(item.weight)
          }))
          .resultAsync();

        if (groupByGoodList) {
          for (let seq = 0; seq <= groupByGoodList!.length; seq++) {
            this.items.push({
              id: seq + 1,
              seq: groupByGoodList[seq] ? groupByGoodList[seq].seq : undefined,
              goodId: groupByGoodList[seq] ? groupByGoodList[seq].goodId : undefined,
              goodName: groupByGoodList[seq] ? groupByGoodList[seq].goodName : undefined,
              day: [{
                goodId: groupByGoodList[seq] ? groupByGoodList[seq].goodId : undefined,
                quantity: undefined,
                day: undefined
              }],
              totalQuantity: groupByGoodList[seq] ? groupByGoodList[seq].totalQuantity : groupByDateList.sum(item => item.quantity)
            });

            this.items![seq].day!.shift();

            if (seq !== groupByGoodList!.length) {
              for (let i = 1; i <= lastDay; i++) {
                this.items![seq].day!.push({
                  goodId: groupByGoodList[seq].goodId,
                  day: i,
                  quantity: groupByScrapList.filter(item => item.goodId === groupByGoodList[seq].goodId && item.day === i).length > 0 ?
                    groupByScrapList.filter(item => item.goodId === groupByGoodList[seq].goodId && item.day === i).single()!.quantity : undefined
                });
              }
            }
            else {
              for (let i = 1; i <= lastDay; i++) {
                this.items![seq].day!.push({
                  goodId: undefined,
                  day: i,
                  quantity: groupByDateList.filter(item => item.day === i).length > 0 ?
                    groupByDateList.filter(item => item.day === i).single()!.quantity : undefined
                });
              }
            }

          }
        }

        this._cdr.markForCheck();
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }
}

interface IFilterVM {
  year?: number;
  month?: number;
}

interface IGoodScrapVM {
  id: number | undefined;
  seq: number | undefined;
  goodId: number | undefined;
  goodName: string | undefined;
  day: IDayInfoVM[] | undefined;
  totalQuantity: number | undefined;
}

interface IDayInfoVM {
  goodId: number | undefined;
  day: number | undefined;
  quantity: number | undefined;
}
