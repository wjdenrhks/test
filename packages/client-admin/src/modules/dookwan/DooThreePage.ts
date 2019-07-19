import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
//import {DateOnly} from "@simplism/core";
//import {MainDbContext} from "@sample/main-database";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {DateOnly} from "@simplism/core";
import {MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
//import {sorm} from "@simplism/orm-query";


//import {DateOnly, DateTime} from "@simplism/core";

//import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-doo-three",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container>
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>두관1</h4>

          <sd-topbar-menu>
            두관2
          </sd-topbar-menu>
          <sd-topbar-menu style="float: right">
            두관3
          </sd-topbar-menu>

        </sd-topbar>
        <sd-dock-container>

          <!--<sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'정렬기준'">
                <sd-select [(value)]="filter.sort">
                  <sd-select-item [value]="sort.type" *ngFor="let sort of sortTypes; trackBy: trackByMeFn">
                    {{ sort.name }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'userId'">
                <sd-textfield [(value)]="filter.userId"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'name'">
                <sd-textfield [(value)]="filter.name"></sd-textfield>
              </sd-form-item>
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'info'">
                  <sd-icon [icon]="'search'" [fixedWidth]="true"></sd-icon>
                  조회
                </sd-button>
              </sd-form-item>
            </sd-form>
          </sd-dock>-->

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination></sd-pagination>
          </sd-dock>

          <sd-busy-container [busy]="mainBusyCount>0">
            <sd-dock-container>
              <sd-dock-container>
                <sd-dock class="sd-background-white sd-padding-sm-default" *ngIf="items && items.length > 0">
                  <table class="_test">
                    <thead>
                    <tr>
                      <th class="sd-padding-sm-xs" style="text-align: center;"> NO</th>
                      <th class="sd-padding-sm-xs" style="text-align: center; width: 100px;"> 품명</th>
                      <!--여기는 가로 날짜-->
                      <ng-container *ngFor="let item of items[0].day">
                        <th class="sd-padding-xs-sm"> {{ item.day + '일' }}</th>
                      </ng-container>
                      <!--여기는 가로 날짜-->
                      <th class="sd-padding-xs-sm" style="text-align: center;"> 소계</th>
                    </tr>
                    </thead>
                    <tbody *ngFor="let scrapItem of items">
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

            </sd-dock-container>
          </sd-busy-container>

        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>
  `,
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
export class DooThreePage implements OnInit {

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


  public dooarr = [] as number[];

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

        /*
        * 최종
        *this.items에는 day, goodId, goodName, id, seq, totalQuantity
        * */

        console.log("@@");
        console.log(groupByGoodList);
        console.log(groupByScrapList);
        console.log(groupByDateList);
        console.log(lastDay);
        console.log(firstDate);
        console.log(lastDate);
        console.log("@@");


        for (let i = 0; i <= groupByGoodList.length; i++) {


          this.items.push({
            id: i + 1,
            seq: groupByGoodList[i] ? groupByGoodList[i].seq : undefined,
            goodId: groupByGoodList[i] ? groupByGoodList[i].goodId : undefined,
            goodName: groupByGoodList[i] ? groupByGoodList[i].goodName : undefined,
            day: [{
              goodId: groupByGoodList[i] ? groupByGoodList[i].goodId : undefined,
              day: undefined,
              quantity: undefined
            }],
            totalQuantity: groupByGoodList[i] ? groupByGoodList[i].totalQuantity : groupByDateList[0].quantity     //마지막 값은 포문 돌 때의 합을 구하면 된다.
          });

          this.items![i].day!.shift();//day에 있는 값 제거


          //groupByScrapList
          /*
          *0: {goodId: 1, goodName: "1010-23", quantity: 1000, day: 4}
           1: {goodId: 2, goodName: "1010-23", quantity: 10, day: 4}
          *
          *
          * for(var k=0; k<groupByScrapList.length; k++){
          *  if(k==i){
          *   if(groupByScrapList[k].day== k)
          *   return groupByScrapList[k].quantity
          *  }
          * }
          * */

          for (let j = 1; j <= lastDay; j++) {
            this.items[i].day!.push({
              goodId: groupByGoodList[i] ? groupByGoodList[i].goodId : undefined,
              day: j,
              quantity: groupByScrapList.filter(item => item.goodId === groupByGoodList[i].goodId && item.day === j).length > 0 ?
                groupByScrapList.filter(item => item.goodId === groupByGoodList[i].goodId && item.day === j).single()!.quantity : undefined
            });
          }

        }


        console.log(this.items);


      });


    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;

  }

  // private async doo(groupByScrapList: [],i : number): Promise<any> {
  //
  //
  //
  //   for(var k=0; k<groupByScrapList.length; k++){
  //     if(k==i){
  //        if(groupByScrapList[k].day== k)
  //            return groupByScrapList[k].quantity
  //           }
  //    }
  //
  // }

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
