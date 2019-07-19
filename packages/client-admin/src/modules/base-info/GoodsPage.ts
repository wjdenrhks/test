import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {SdDomValidatorProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {Goods, MainDbContext} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";

@Component({
  selector: "app-goods",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<!--뷰 정의, html 덩어리-->
  <sd-busy-container [busy]="viewBusyCount > 0">
    <sd-topbar-container>
      <sd-topbar class="sd-background-secondary-darkest">
        <h4>제품 관리</h4>
        <sd-topbar-menu (click)="onAddItemButtonClick()">
          <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
          행 추가
        </sd-topbar-menu>
        <sd-topbar-menu (click)="onSaveButtonClick()">
          <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
          저장
        </sd-topbar-menu>
        <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
          <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
          메뉴얼 보기
        </sd-topbar-menu>
      </sd-topbar>

      <sd-dock-container>
        <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
          <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
            <sd-form-item [label]="'제품명'">
              <sd-textfield [(value)]="filter.name"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'제품분류'">
              <sd-textfield [(value)]="filter.category"></sd-textfield>
            </sd-form-item>
            <sd-form-item [label]="'제품용도'">
              <sd-textfield [(value)]="filter.purpose"></sd-textfield>
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

        <sd-busy-container [busy]="mainBusyCount > 0">
          <sd-sheet #sheet [id]="'goods'" [items]="items" [trackBy]="trackByIdFn">
            <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
              <ng-template #item let-item="item">
                <div class="sd-padding-xs-sm" style="text-align: center;">
                  <span>{{ item.viewId }}</span>
                </div>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'제품구분'" [width]="100">
              <ng-template #item let-item="item">
                <sd-textfield [(value)]="item.type"
                ></sd-textfield>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'제품분류'" [width]="100">
              <ng-template #item let-item="item">
                <sd-textfield [(value)]="item.category"
                ></sd-textfield>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'제품용도'">
              <ng-template #item let-item="item">
                <sd-textfield [(value)]="item.purpose"
                ></sd-textfield>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'제품명'">
              <ng-template #item let-item="item">
                <sd-textfield [(value)]="item.name"
                ></sd-textfield>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'규격'" [width]="100">
              <ng-template #item let-item="item">
                <sd-textfield [(value)]="item.specification"
                ></sd-textfield>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'두께'" [width]="100">
              <ng-template #item let-item="item">
                <sd-textfield [(value)]="item.thick"
                ></sd-textfield>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'중량'" [width]="80">
              <ng-template #item let-item="item">
                <sd-textfield [(value)]="item.weight"
                ></sd-textfield>
              </ng-template>
            </sd-sheet-column>
            <sd-sheet-column [header]="'단위'" [width]="80">
              <ng-template #item let-item="item">
                <sd-textfield [(value)]="item.unitName"
                ></sd-textfield>
              </ng-template>
            </sd-sheet-column>
          </sd-sheet>
        </sd-busy-container>
      </sd-dock-container>
    </sd-topbar-container>
  </sd-busy-container>`
})
//                                  ##
export class GoodsPage implements OnInit {

  public filter: IFilterVM = {
    sort: "id",
    name: undefined,
    category: undefined,
    purpose: undefined

  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public sortTypes?: {
    name: string;
    type: string;
  }[];

  public items: IGoodsVM[] = [];
  public orgItems: IGoodsVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;


  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _cdr: ChangeDetectorRef) {

  }

  // 1. ngOnInt()사용 시 상단에 implements OnInit 반드시 추가(## 참고)
  // 기본적으로 화면 구성 전에 입력되어 있어야 하는 값, function 실행
  public async ngOnInit(): Promise<void> {

    this.sortTypes = [
      {name: "ID", type: "id"},
      {name: "제품명", type: "name"},
      {name: "제품분류", type: "category"},
      {name: "제품용도", type: "purpose"}
    ];

    // 2. onSearchFormSubmit() 실행
    await this.onSearchFormSubmit();
    this._cdr.markForCheck();

  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      viewId: undefined,
      id: undefined,
      type: undefined,
      category: undefined,
      purpose: undefined,
      name: undefined,
      specification: undefined,
      thick: undefined,
      weight: undefined,
      unitName: undefined
    });
  }

  // 저장 function
  public async onSaveButtonClick(): Promise<void> {
    await this._save();
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

    //추가되거나 변경된 로우가 나옴, 변경된게 없으면 []
    console.log(diffTargets);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    for (const diffTargetItem of diffTargets) {
      if (!diffTargetItem.name) {
        this._toast.danger("제품명은 반드시 입력해야 합니다.");
        return;
      }

    }
    this.viewBusyCount++;
    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffTarget of diffTargets) {
          const upsertedItem = await this._saveItem(db, diffTarget);
          diffTarget.id = upsertedItem.id;
          diffTarget.viewId = upsertedItem.id;
        }
      });

      this.orgItems = Object.clone(this.items);
      this._toast.success("저장되었습니다.");
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  private async _saveItem(db: MainDbContext, upsertItem: IGoodsVM): Promise<IGoodsVM> {
    // INSERT
    if (!upsertItem.id) {
      const newItem = await db.goods
        .insertAsync({
          companyId: this._appData.authInfo!.companyId,
          type: upsertItem.type,
          category: upsertItem.category,
          purpose: upsertItem.purpose,
          name : upsertItem.name!,
          specification : upsertItem.specification,
          thick : upsertItem.thick,
          weight : upsertItem.weight,
          unitName : upsertItem.unitName,
          isDisabled : true,
          erpSyncCode : 1
        });

      return {
        ...upsertItem,
        id: newItem.id
      };
    }
    // UPDATE
    else {
      await db.goods
        .where(item => [
          sorm.equal(item.id, upsertItem.id)
        ])
        .updateAsync(
          () => ({
            companyId: this._appData.authInfo!.companyId,
            type: upsertItem.type,
            category: upsertItem.category,
            purpose: upsertItem.purpose,
            name : upsertItem.name!,
            specification : upsertItem.specification,
            thick : upsertItem.thick,
            weight : upsertItem.weight,
            unitName : upsertItem.unitName,
            isDisabled : true
          })
        );

      return upsertItem;
    }
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  public async onSearchFormSubmit(): Promise<void> {
    // 페이징 기본값 0으로 초기화
    this.pagination.page = 0;
    // 사용자 선택값으로 마지막 필터(검색조건) 수정해줌
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {

      // DB 연결 (아래는 기본적으로 사용하는 구문)
      /* await this._orm.connectAsync(MainDbContext, async db => {});*/
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);
        const sortQuery = "[TBL]." + this.lastFilter!.sort; //여기에서 쓰이는 !는 무엇인가 : this.lastFilter는 무조건 있다

        // 쿼리 실행하고 반환값은 this.itmes에 저장
        this.items = await queryable
          .orderBy(item => sorm.query(sortQuery, String))
          .select(item => ({
            viewId: sorm.query("ROW_NUMBER() OVER (ORDER BY" + sortQuery + " ASC)", Number),
            id: item.id,
            type: item.type,
            category: item.category,
            purpose: item.purpose,
            name: item.name,
            specification: item.specification,
            thick: item.thick,
            weight: item.weight,
            unitName: item.unitName
          }))
          .limit(this.pagination.page * 50, 50)
          .resultAsync();


        /* this.orgItems에 위에서 입력한 this.items를 clone(복사)시켜줌
           this.orgItems은 검색값(사용자가 수정하기 전 db에서 가져온 기본값)
           this.items는 화면에서 사용자가 수정 한 값 이라고 생각하면 됨
        */
        this.orgItems = Object.clone(this.items);

        console.log(this.orgItems);

        const totalCount = await queryable.countAsync();
        this.pagination.length = Math.ceil(totalCount / 50);
      });
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.mainBusyCount--;
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<Goods> {
    let queryable = db.goods
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);


    if (this.lastFilter!.name) {
      queryable = queryable.where(item => [
        sorm.search([item.name], this.lastFilter!.name!.toUpperCase())
      ]);
    }

    if (this.lastFilter!.category) {
      queryable = queryable
        .where(item => [
          sorm.search([item.category], this.lastFilter!.category!.toUpperCase())
        ]);
    }

    if (this.lastFilter!.purpose) {
      queryable = queryable.where(item => [
        sorm.search([item.purpose], this.lastFilter!.purpose!.toUpperCase())
      ]);
    }

    return queryable;
  }


}

// 필터 Model
interface IFilterVM {
  sort?: string;
  name?: string;
  category?: string;
  purpose?: string;
}

// 기본 화면 item Model
export interface IGoodsVM {
  viewId: number | undefined;
  id: number | undefined;
  type: string | undefined;
  category: string | undefined;
  purpose: string | undefined;
  name: string | undefined;
  specification: string | undefined;
  thick: number | undefined;
  weight: number | undefined;
  unitName: string | undefined;
}