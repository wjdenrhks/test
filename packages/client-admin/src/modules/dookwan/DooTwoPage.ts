import {ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnInit} from "@angular/core";
import {SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {BaseType, MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {Queryable} from "@simplism/orm-client";

//import {DateOnly, DateTime} from "@simplism/core";

//import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-doo-two",
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

              <sd-sheet #sheet [id]="'doo-two'"
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
                <sd-sheet-column [header]="'구분'" [fixed]="true" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <!--{{ 띄어쓰기 }}-->
                      <span>{{ item.type }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'명칭'" [fixed]="true" [width]="100">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.name" [required]="true"
                                  (valueChange)="onChangeName(item)"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'사용중지'" [fixed]="true" [width]="100">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span>{{ item.isDisabled }}</span>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

            </sd-dock-container>
          </sd-busy-container>

        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>
  `
})
export class DooTwoPage implements OnInit {

  public mainBusyCount = 0;
  public pagination = {page: 0, length: 0};

  public items: IBaseTypeVM[] = [];
  public orgItems: IBaseTypeVM[] = [];
  public selectedItem?: IBaseTypeVM;

  public trackByIdFn = (i: number, item: any) => item.id || item;


  public constructor(private readonly _orm: SdOrmProvider,
                     //private readonly _modal: SdModalProvider,
                     //private readonly _socket: SdSocketProvider,
                     //private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _cdr: ChangeDetectorRef) {

  }

  public async ngOnInit(): Promise<void> {
    // console.log(this.items);
    // console.log(this.items);
    // this.items = [
    //   {id:2, type:"3",name:"3",isDisabled:true},
    //   {id:2, type:"3",name:"3",isDisabled:true}
    // ]
    // console.log(this.items);

    await this.onSearchFormSubmit();
    this._cdr.markForCheck();

  }


  public async onChangeName(item: IBaseTypeVM): Promise<void> {
    if (!!item.name) {
      item.name = item.name!.toUpperCase();
    }
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

  private async _save(): Promise<void> {
    const diffTargets = this.orgItems.diffs(this.items, {keyProps: ["id"]}).map(item => item.target!);
    console.log(diffTargets);
  }

  public async onSearchFormSubmit(): Promise<void> {
    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {
    //if (!this.lastFilter) return;
    this.mainBusyCount++;
    try {

      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);

        const sortQuery = "[TBL].id"; //+ this.lastFilter!.sort;

        this.items = await queryable
          .orderBy(item => sorm.query(sortQuery, String))
          .select(item => ({
            id: item.id,
            type: item.type,
            name: item.name,
            isDisabled: item.isDisabled
          }))
          .limit(this.pagination.page * 10, 10)
          .resultAsync();


        this.orgItems = Object.clone(this.items);


        console.log(this.items);


      });

    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }


  private _getSearchQueryable(db: MainDbContext): Queryable<BaseType> {
    let queryable = db.baseType;


    return queryable;
  }
}

//기본 화면 item model
interface IBaseTypeVM {
  id: number | undefined;
  type: string | undefined;
  name: string | undefined;
  isDisabled: boolean;

}