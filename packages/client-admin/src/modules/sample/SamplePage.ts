import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {BaseType, MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {SdDomValidatorProvider, SdModalProvider, SdOrmProvider, SdToastProvider} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {Queryable} from "@simplism/orm-client";
import {ShowManualModal} from "../../modals/ShowManualModal";

@Component({
  selector: "app-sample",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--<sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>재고 입고</h4>

          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onDownloadButtonClick()">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onBarcodePrintButtonClick()" style="float: right; margin-right: 25px;">
            <sd-icon [icon]="'barcode'" [fixedWidth]="true"></sd-icon>
            바코드 출력
          </sd-topbar-menu>
        </sd-topbar>
      </sd-topbar-container>
    </sd-busy-container>-->
  `
})
export class SamplePage implements OnInit {

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
                     private readonly _modal: SdModalProvider,
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
      "재질정보",
      "품질 검사항목",
      "수입 검사항목",
      "입고구분",
      "창고구분",
      "스크랩유형"
    ].filterExists();

    this.mainBusyCount++;
    await this.onSearchFormSubmit();
    this.mainBusyCount--;
    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "기초정보 메뉴얼", {type: "base-type"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items.insert(0, {
      viewId: undefined,
      id: undefined,
      type: undefined,
      name: undefined,
      displayOrder: undefined,
      isDisabled: false
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
          isDisabled: {displayName: "사용중지", type: Boolean, notnull: true}
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
          isDisabled: upsertItem.isDisabled
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
            isDisabled: upsertItem.isDisabled
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
            isDisabled: item.isDisabled
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
}
