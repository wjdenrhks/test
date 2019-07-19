import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {BaseType, MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {SdDomValidatorProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {Queryable} from "@simplism/orm-client";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-base-type",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container>
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>기초정보</h4>

          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onDownloadButtonClick()" *ngIf="items">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>
        </sd-topbar>

        <sd-dock-container>

          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'구분'">
                <sd-select [(value)]="filter.type">
                  <sd-select-item [value]="undefined">전체</sd-select-item>
                  <sd-select-item [value]="type" *ngFor="let type of types; trackBy: trackByMeFn">
                    {{ type }}
                  </sd-select-item>
                </sd-select>
              </sd-form-item>
              
              
              
              <sd-form-item [label]="'명칭'">
                <sd-textfield [(value)]="filter.name"></sd-textfield>
              </sd-form-item>
              <sd-form-item>
                <sd-button [type]="'submit'" [theme]="'primary'">
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
            <sd-sheet #sheet [id]="'base-type'" [items]="items" [trackBy]="trackByIdFn">
              <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                
                <ng-template #item let-item="item">
                  <div class="sd-padding-xs-sm" style="text-align: center;">
                    <span *ngIf="item.id">{{ item.viewId }}</span>
                    <a *ngIf="!item.id" (click)="onRemoveItemButtonClick(item)">
                      <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                    </a>
                  </div>
                </ng-template>
                
              </sd-sheet-column>
              <sd-sheet-column [header]="'구분'" [fixed]="true">
                <ng-template #item let-item="item">
                  <sd-select [(value)]="item.type"
                             [required]="true"
                             [disabled]="!!item.id">
                    <sd-select-item [value]="type" *ngFor="let type of types;">
                      {{ type }}
                    </sd-select-item>
                  </sd-select>
                </ng-template>
              </sd-sheet-column>
              
              <sd-sheet-column [header]="'명칭'" [fixed]="true">
                <ng-template #item let-item="item">
                  <sd-textfield [(value)]="item.name" [required]="true"
                                (valueChange)="onChangeName(item)"></sd-textfield>
                </ng-template>
              </sd-sheet-column>


              <sd-sheet-column [header]="'비고'" [fixed]="true">
                <ng-template #item let-item="item">
                  <sd-textfield [(value)]="item.remark" 
                                ></sd-textfield>
                </ng-template>
              </sd-sheet-column>
              
              
              <sd-sheet-column [header]="'사용중지'" [width]="60">
                <ng-template #item let-item="item">
                  <div style="text-align: center;">
                    <sd-checkbox [(value)]="item.isDisabled"></sd-checkbox>
                  </div>
                </ng-template>
              </sd-sheet-column>
            </sd-sheet>
          </sd-busy-container>
          
        </sd-dock-container>
        
        
        
      </sd-topbar-container>
    </sd-busy-container>
  `
})
export class BaseTypePage implements OnInit {


  public filter: IFilterVM = {
    sort: "id",
    type: undefined,
    name: undefined,
    isDisabled: false
  };
  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public types: string[] = [];
  public sortTypes?: {
    name: string;
    type: string;
  }[];

  public items: IBaseTypeVM[] = [];
  public orgItems: IBaseTypeVM[] = [];

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


  public async ngOnInit(): Promise<void> {
    this.sortTypes = [
      {name: "ID", type: "id"},
      {name: "구분", type: "type"},
      {name: "명칭", type: "name"}
    ];

    this.types = [
      "배차정보",
      "반품사유",
      "단위정보",
      "재질정보"
    ].filterExists();

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


      const wb = ExcelWorkbook.create();
      const ws = wb.createWorksheet(`기초정보`);

      ws.cell(0, 0).merge(0, 4);
      ws.cell(0, 0).value = "기초정보";
      ws.cell(1, 0).value = "ID";
      ws.cell(1, 1).value = "구분";
      ws.cell(1, 2).value = "명칭";
      ws.cell(1, 3).value = "비고";
      ws.cell(1, 4).value = "사용중지";


      console.log(this.items);


      let nowScrapSeq = 0;
      for(const nowScrapItem of this.items! || []){

        ws.cell(2+nowScrapSeq, 0).value = nowScrapItem.viewId;
        ws.cell(2+nowScrapSeq, 1).value = nowScrapItem.type;
        ws.cell(2+nowScrapSeq, 2).value = nowScrapItem.name;
        ws.cell(2+nowScrapSeq, 3).value = nowScrapItem.remark;
        nowScrapItem.isDisabled ? ws.cell(2+nowScrapSeq, 4).value = "V"
          : ws.cell(2+nowScrapSeq, 4).value = "";

        nowScrapSeq++;
      }

      const title = "기초정보.xlsx";

      await wb.downloadAsync(title);
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }

    this.viewBusyCount--;
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      viewId: undefined,
      id: undefined,
      type: undefined,
      name: undefined,
      displayOrder: undefined,
      isDisabled: false,
      remark : undefined
    });
  }

  public onRemoveItemButtonClick(item: IBaseTypeVM): void {
    this.items.remove(item);
  }

  public async onSearchFormSubmit(): Promise<void> {
    this.pagination.page = 0;
    this.lastFilter = Object.clone(this.filter);
    await this._search();
    this._cdr.markForCheck();
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  // 저장 function
  public async onSaveButtonClick(): Promise<void> {
    await this._save();
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

    //추가되거나 변경된 로우가 나옴, 변경된게 없으면 []
    console.log(diffTargets);

    if (diffTargets.length < 1) {
      this._toast.info("변경사항이 없습니다.");
      if (process.env.NODE_ENV === "test") console.log("변경사항이 없습니다.");
      return;
    }

    for (const diffTargetItem of diffTargets) {
      if (!diffTargetItem.name || !diffTargetItem.type) {
        this._toast.danger("구분\/명칭은 반드시 입력해야 합니다.");
        return;
      }

      if (this.items.filter(item => (item.type === diffTargetItem.type && item.name === diffTargetItem.name)).length > 1) {
        this._toast.danger("\"" + diffTargetItem.type + "\"에 동일한 값이 등록되어 있습니다. : " + diffTargetItem.name);
        return;
      }
    }
    this.viewBusyCount++;
    try {
      this._domValidator.validate(this._elRef!.nativeElement);

      //정두관 타입 검사?
      Object.validatesArray(
        diffTargets,
        `기초정보`,
        {
          id: {displayName: "ID", type: Number},
          type: {
            displayName: "구분",
            type: String,
            notnull: true,
            validator: (item: any) => this.types.includes(item)
          },
          name: {displayName: "명칭", type: String, notnull: true},
          isDisabled: {displayName: "사용중지", type: Boolean, notnull: true},
          remark: {displayName: "비고", type: String, notnull: false}
        }
      );

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

  private async _saveItem(db: MainDbContext, upsertItem: IBaseTypeVM): Promise<IBaseTypeVM> {
    // INSERT
    if (!upsertItem.id) {
      if (
        !upsertItem.isDisabled &&
        await db.baseType
          .where(item => [
            sorm.notEqual(item.isDisabled, true),
            sorm.equal(item.type, upsertItem.type!),
            sorm.equal(item.name, upsertItem.name!),
            sorm.notEqual(item.id, upsertItem.id!)
          ])
          .countAsync() > 0
      ) {
        throw new Error("\"" + upsertItem.type! + "\"에 동일한 이름이 등록되어 있습니다 : " + upsertItem.name!);
      }

      const newItem = await db.baseType
        .insertAsync({
          companyId: this._appData.authInfo!.companyId,
          type: upsertItem.type!,
          name: upsertItem.name!,
          isDisabled: upsertItem.isDisabled,
          remark : upsertItem.remark
        });

      return {
        ...upsertItem,
        id: newItem.id
      };
    }
    // UPDATE
    else {
      await db.baseType
        .where(item => [
          sorm.equal(item.id, upsertItem.id)
        ])
        .updateAsync(
          () => ({
            companyId: this._appData.authInfo!.companyId,
            type: upsertItem.type!,
            name: upsertItem.name!,
            isDisabled: upsertItem.isDisabled,
            remark : upsertItem.remark
          })
        );

      return upsertItem;
    }
  }

  private async _search(): Promise<void> {
    if (!this.lastFilter) return;

    this.mainBusyCount++;
    try {
      await this._orm.connectAsync(MainDbContext, async db => {
        const queryable = this._getSearchQueryable(db);
        const sortQuery = "[TBL]." + this.lastFilter!.sort;

        this.items = await queryable
          .orderBy(item => sorm.query(sortQuery, String))
          .select(item => ({
            viewId: sorm.query("ROW_NUMBER() OVER (ORDER BY" + sortQuery + " ASC)", Number),
            id: item.id,
            type: item.type,
            name: item.name,
            displayOrder: item.displayOrder,
            isDisabled: item.isDisabled,
            remark : item.remark
          }))
          .limit(this.pagination.page * 50, 50)
          .resultAsync();

        this.orgItems = Object.clone(this.items);

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

  private _getSearchQueryable(db: MainDbContext): Queryable<BaseType> {
    let queryable = db.baseType
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.type) {
      queryable = queryable.where(item => [
        sorm.equal(item.type, this.lastFilter!.type)
      ]);
    }

    if (this.lastFilter!.name) {
      const firstIndex = this.lastFilter!.name!.indexOf("\(");
      const lastIndex = this.lastFilter!.name!.indexOf("\)");

      if (firstIndex > 0 && lastIndex > 0) {
        const searchText1 = this.lastFilter!.name!.substr(0, firstIndex);
        const searchText2 = this.lastFilter!.name!.substring(firstIndex + 1, lastIndex);

        queryable = queryable.where(item => [
          sorm.or([
            sorm.search([item.name], searchText1),
            sorm.search([item.name], searchText2)
          ])
        ]);
      }
      else {
        queryable = queryable.where(item => [
          sorm.search([item.name], this.lastFilter!.name!.toUpperCase())
        ]);
      }
    }

    if (this.lastFilter!.isDisabled !== false) {
      queryable = queryable.where(item => [
        sorm.notEqual(item.isDisabled, true)
      ]);
    }

    return queryable;
  }

}

interface IFilterVM {
  sort?: string;
  type?: string;
  name?: string;
  isDisabled: boolean;
}

interface IBaseTypeVM {
  viewId: number | undefined;
  id: number | undefined;
  type: string | undefined;
  name: string | undefined;
  displayOrder: number | undefined;
  isDisabled: boolean;
  remark: string | undefined;
}
