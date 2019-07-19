import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from "@angular/core";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {Employee, MainDbContext} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
//import {DateOnly, DateTime} from "@simplism/core";

//import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-dookwan",
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

          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
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
          </sd-dock>

          <sd-dock class="sd-padding-sm-default">
            <sd-pagination [page]="pagination.page" [length]="pagination.length"
                           (pageChange)="onPageClick($event)"></sd-pagination>
          </sd-dock>
          <sd-busy-container [busy]="mainBusyCount>0">
            <sd-dock-container>

              <sd-sheet #sheet [id]="'dookwan'"
                        [items]="items" [trackBy]="trackByIdFn"
                        [(selectedItem)]="selectedItem"
                        [selectable]="true">


                <sd-sheet-column [header]="'id'" [fixed]="true" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span>{{ item.id }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'유저Id'" [fixed]="true" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span>{{ item.userId }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'name'" [fixed]="true" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span>{{ item.name }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>


              <sd-dock [position]="'bottom'" style="height: 40%" *ngIf="selectedItem"
                       [id]="'equipment-repair-list'">
                <sd-dock-container class="sd-background-default">
                  <sd-dock class="sd-padding-xs-sm">
                    <h5 style="display: inline-block; padding-right: 1.4em;">상세정보</h5>
                  </sd-dock>
                  <sd-pane>
                    <sd-sheet [id]="'equipment-repair'"
                              [items]="selectedItem.detail"
                              [trackBy]="trackByIdFn">
                      <sd-sheet-column [header]="'사번'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.code"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'소속'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.department"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                      <sd-sheet-column [header]="'직책'">
                        <ng-template #item let-item="item">
                          <sd-textfield [(value)]="item.position"></sd-textfield>
                        </ng-template>
                      </sd-sheet-column>
                    </sd-sheet>
                  </sd-pane>
                </sd-dock-container>
              </sd-dock>


            </sd-dock-container>
          </sd-busy-container>

        </sd-dock-container>

      </sd-topbar-container>
    </sd-busy-container>
  `
})
export class DookwanPage implements OnInit {

  public filter: IFilterVM = {
    sort: "id",
    userId: undefined,
    name: undefined
  };

  public lastFilter?: IFilterVM;

  public items: IEmployeeVM[] = [];
  public selectedItem?: IEmployeeVM;

  public pagination = {page: 0, length: 0};

  public types: {
    name: string | undefined;
    category: {
      name: string | undefined;
    }[];
  }[] = [];

  //public dookwan : string ;

  public sortTypes?: {
    name: string;
    type: string;
  }[];

  public userGroupList: {
    id: number;
    name: string;
  }[] = [];

  public mainBusyCount = 0;

  /*로우 클릭시 필요한 소스 starts*/

  /*로우 클릭시 필요한 소스 ends*/

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public constructor(private readonly _orm: SdOrmProvider,
                     //private readonly _modal: SdModalProvider,
                     //private readonly _socket: SdSocketProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {

  }

  public async ngOnInit(): Promise<void> {


    this.sortTypes = [
      {name: "ID", type: "id"},
      {name: "userId", type: "userId"},
      {name: "name", type: "name"}
    ];


    await this._orm.connectAsync(MainDbContext, async db => { //여기서부터 디비 접속 및 쿼리
      const result = await db.goods
        .where(item => [    //여기 item이 무엇인가
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.notNull(item.type),
          sorm.equal(item.isDisabled, false)
        ])
        .groupBy(item => [
          item.type,
          item.category
        ])
        .select(item => ({
          type: item.type,
          category: item.category
        }))
        .resultAsync();


      // 아래 .filter()는 일종의 select !!item1.category => undefined가 아닌 category만 list에 남겨 둠
      this.types = result
        .groupBy(item => ({
          type: item.type
        }))
        .map(item => ({
          name: item.key.type,
          category: item.values.filter(item1 => !!item1.category).map(item1 => ({
            name: item1.category
          }))
        }));
    });
    this.mainBusyCount--;

    await this.onSearchFormSubmit();
    this._cdr.markForCheck();
  }

  // 화면 중단 페이징 클릭 시
  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {

    this.pagination.page = 0;

    this.lastFilter = Object.clone(this.filter);

    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {
    //if (!this.lastFilter) return;
    this.mainBusyCount++;
    try {


      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        const sortQuery = "[TBL]." + this.lastFilter!.sort; //+ this.lastFilter!.sort;

        this.items = await queryable
          .orderBy(item => sorm.query(sortQuery, String))
          .select(item => ({
            id: item.id,
            userId: item.userId,
            name: item.name,
            detail: {
              code: item.code,
              department: item.department,
              position: item.position
            }
          }))
          .limit(this.pagination.page * 10, 10)
          .resultAsync();

        console.log(this.items);


        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 10);


      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<Employee> {
    let queryable = db.employee;

    if (this.lastFilter!.name) {
      queryable = queryable.where(item => [
        sorm.includes(item.name, this.lastFilter!.name)
      ]);
    }

    if (this.lastFilter!.userId) {
      queryable = queryable.where(item => [
        sorm.includes(item.userId, this.lastFilter!.userId)
      ]);
    }

    return queryable;
  }

}

// 필터 Model
interface IFilterVM {
  sort?: string;
  userId?: string;
  name?: string;
}

// 기본 화면 item Model
interface IEmployeeVM {
  id: number | undefined;
  userId: string | undefined;
  name: string | undefined;
  detail: IEmployeeDetail | undefined;

  // id: number | undefined;
  // name: string | undefined;
  // userId: number | undefined;
  // password: string | undefined;
  // department: string | undefined;
  // position: string | undefined;
  // userGroupId: number | undefined;
  // userGroupName: string | undefined;
  // sex: number | undefined;
  // email: string | undefined;
  // phone: string | undefined;
  // isDisabled: boolean;
  //detailList: IEmployeeDetailVM[] | undefined;


}

interface IEmployeeDetail {
  code: string | undefined;
  department: string | undefined;
  position: string | undefined;

}

// interface IEmployeeDetailVM {
//   code: string | undefined;
//   department: string | undefined;
//   position: string | undefined;
// }