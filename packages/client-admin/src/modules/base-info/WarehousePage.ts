import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnInit} from "@angular/core";
import {MainDbContext, Warehouse} from "@sample/main-database";
import {Queryable} from "@simplism/orm-client";
import {sorm} from "@simplism/orm-query";
import {
  SdDomValidatorProvider,
  SdFileDialogProvider,
  SdModalProvider,
  SdOrmProvider,
  SdToastProvider
} from "@simplism/angular";
import {AppDataProvider} from "@sample/client-common";
import {ShowManualModal} from "../../modals/ShowManualModal";
import {ExcelWorkbook} from "@simplism/excel";

@Component({
  selector: "app-warehouse",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-busy-container [busy]="viewBusyCount > 0">
      <sd-topbar-container>
        <sd-topbar class="sd-background-secondary-darkest">
          <h4>창고 관리</h4>

          <sd-topbar-menu (click)="onAddItemButtonClick()">
            <sd-icon [icon]="'plus'" [fixedWidth]="true"></sd-icon>
            행 추가
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onSaveButtonClick()">
            <sd-icon [icon]="'save'" [fixedWidth]="true"></sd-icon>
            저장
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onUploadButtonClick()">
            <sd-icon [icon]="'upload'" [fixedWidth]="true"></sd-icon>
            업로드
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onShowManualButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'atlas'" [fixedWidth]="true"></sd-icon>
            메뉴얼 보기
          </sd-topbar-menu>
          <sd-topbar-menu (click)="onUploadExcelDownloadButtonClick()" style="float: right; padding-right: 25px;">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            업로드 양식 다운로드
          </sd-topbar-menu>
          <!--<sd-topbar-menu *ngIf="lastFilter && (items && orgItems.length > 0)" (click)="onDownloadButtonClick()">
            <sd-icon [icon]="'download'" [fixedWidth]="true"></sd-icon>
            다운로드
          </sd-topbar-menu>-->
        </sd-topbar>

        <sd-dock-container>
          <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
            <sd-form [inline]="true" (submit)="onSearchFormSubmit()">
              <sd-form-item [label]="'창고명칭'">
                <sd-textfield [(value)]="filter.name"></sd-textfield>
              </sd-form-item>
              <sd-form-item [label]="'등급'">
                <sd-select [(value)]="filter.rating">
                  <sd-select-item [value]="">전체</sd-select-item>
                  <sd-select-item [value]="'A'">A</sd-select-item>
                  <sd-select-item [value]="'B'">B</sd-select-item>
                  <sd-select-item [value]="'C'">C</sd-select-item>
                  <sd-select-item [value]="'공통'">공통</sd-select-item>
                </sd-select>
              </sd-form-item>
              <sd-form-item [label]="'사용중지 제외'">
                <sd-checkbox [(value)]="filter.isDisabled"></sd-checkbox>
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
            <sd-dock-container>
              <sd-sheet #sheet [id]="'warehouse'"
                        [items]="items"
                        [trackBy]="trackByIdFn">
                <sd-sheet-column [header]="'ID'" [fixed]="true" [width]="40">
                  <ng-template #item let-item="item">
                    <div class="sd-padding-xs-sm" style="text-align: center;">
                      <span *ngIf="item.id">{{ item.id }}</span>
                      <a *ngIf="!item.id" (click)="onRemoveItemButtonClick(item)">
                        <sd-icon [icon]="'times'" [fixedWidth]="true"></sd-icon>
                      </a>
                    </div>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'창고명칭'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.typeId" [required]="true" [disabled]="item && item.id === 1">
                      <sd-select-item *ngFor="let type of typeList; trackBy: trackByMeFn"
                                      [value]="type.id"
                                      [hidden]="type.isDisabled">
                        {{ type.name }}
                      </sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'로케이션'">
                  <ng-template #item let-item="item">
                    <sd-textfield [(value)]="item.name" [required]="true"
                                  [disabled]="item && item.id === 1"></sd-textfield>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'등급'">
                  <ng-template #item let-item="item">
                    <sd-select [(value)]="item.rating">
                      <sd-select-item [value]="'A'">A</sd-select-item>
                      <sd-select-item [value]="'B'">B</sd-select-item>
                      <sd-select-item [value]="'C'">C</sd-select-item>
                      <sd-select-item [value]="'공통'">공통</sd-select-item>
                    </sd-select>
                  </ng-template>
                </sd-sheet-column>
                <sd-sheet-column [header]="'사용중지'" [width]="60">
                  <ng-template #item let-item="item">
                    <div style="text-align: center;">
                      <sd-checkbox [(value)]="item.isDisabled"
                                   [disabled]="!item.id || (item && item.id === 1)"></sd-checkbox>
                    </div>
                  </ng-template>
                </sd-sheet-column>
              </sd-sheet>

            </sd-dock-container>
          </sd-busy-container>
        </sd-dock-container>
      </sd-topbar-container>
    </sd-busy-container>`
})
export class WarehousePage implements OnInit {

  public filter: IFilterVM = {
    name: undefined,
    rating: undefined,
    isDisabled: false
  };

  public lastFilter?: IFilterVM;

  public pagination = {page: 0, length: 0};

  public items: IWarehouseVM[] = [];
  public orgItems: IWarehouseVM[] = [];

  public viewBusyCount = 0;
  public mainBusyCount = 0;

  public trackByIdFn = (i: number, item: any) => item.id || item;
  public trackByMeFn = (i: number, item: any) => item;

  public typeList: {
    id: number;
    name: string;
    isDisabled: boolean;
  }[] = [];

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _modal: SdModalProvider,
                     private readonly _fileDialog: SdFileDialogProvider,
                     private readonly _appData: AppDataProvider,
                     private readonly _toast: SdToastProvider,
                     private readonly _elRef: ElementRef<HTMLElement>,
                     private readonly _domValidator: SdDomValidatorProvider,
                     private readonly _cdr: ChangeDetectorRef) {

  }

  public async ngOnInit(): Promise<void> {
    this.mainBusyCount++;
    await this._orm.connectAsync(MainDbContext, async db => {
      this.typeList = await db.baseType
        .where(item => [
          sorm.equal(item.companyId, this._appData.authInfo!.companyId),
          sorm.equal(item.isDisabled, false),
          sorm.equal(item.type, "창고명칭")
        ])
        .select(item => ({
          id: item.id!,
          name: item.name,
          isDisabled: item.isDisabled
        }))
        .resultAsync();
    });
    await this.onSearchFormSubmit();
    this.mainBusyCount--;
    this._cdr.markForCheck();
  }

  public async onShowManualButtonClick(): Promise<void> {
    const result = await this._modal.show(ShowManualModal, "창고 관리 메뉴얼", {type: "warehouse"});
    if (!result) return;

    this._cdr.markForCheck();
  }

  public onAddItemButtonClick(): void {
    this.items!.insert(0, {
      id: undefined,
      typeId: undefined,
      typeName: undefined,
      name: undefined,
      rating: "A",
      isDisabled: false
    });
  }

  public onRemoveItemButtonClick(item: IWarehouseVM): void {
    this.items!.remove(item);
  }

  public async onUploadExcelDownloadButtonClick(): Promise<void> {
    // 다운로드 방식으로 하려면 이렇게
    const test = require("../../assets/upload_warehouseInfo.xlsx"); //tslint:disable-line:no-require-imports

    const link = document.createElement("a");
    link.href = test;
    link.download = "창고정보 업로드 양식";
    link.click();
  }

  public async onUploadButtonClick(): Promise<void> {
    await this._upload();
    this._cdr.markForCheck();
  }

  private async _upload(): Promise<void> {
    const file = await this._fileDialog.showAsync();
    if (!file) return;

    this.viewBusyCount++;
    this._cdr.markForCheck();

    try {
      const wb = await ExcelWorkbook.loadAsync(file);

      const result: any[] = [];

      // 판매계획 양식을 사용할 경우
      const ws = wb.getWorksheet("창고정보");

      if (ws.rowLength < 2) {
        throw new Error("엑셀에 입력 된 데이터가 없습니다.\n확인 후 다시 진행 해 주세요.");
      }

      for (let r = 1; r < ws.rowLength; r++) {
        for (let i = 0; i < 4; i++) {
          if (ws.cell(r, i).value === undefined) {
            throw new Error("Excel " + (r + 1) + "행의 " + (i + 1) + "열 정보가 비어 있습니다. \n확인 후 다시 진행 해 주세요.");
          }
        }

        const name: string = ws.cell(r, 0).value; // 창고명칭
        const location: string = ws.cell(r, 1).value; // 로케이션
        let rating: string = ws.cell(r, 2).value; // 등급
        const isDisabled: string = ws.cell(r, 3).value; // 사용중지

        rating = rating.toLocaleUpperCase();

        if (!["A", "B", "C", "공통"].includes(rating)) {
          throw new Error("에러(등급): " + rating + "\n등급은 A, B, C, 공통만 입력할 수 있습니다.");
        }

        const nameId = await this._getWarehouseType(name);
        this._cdr.markForCheck();

        result.push({
          name,
          nameId,
          location,
          rating,
          isDisabled
        });
      }

      for (const diffTarget of result) {
        if (await this._getWarehouseInfo(diffTarget.nameId, diffTarget.location) < 1) {
          this.items.insert(0, {
            id: undefined,
            typeId: diffTarget.nameId,
            typeName: diffTarget.name,
            name: diffTarget.location,
            rating: diffTarget.rating,
            isDisabled: diffTarget.isDisabled === 1
          });
        }
      }

      this._toast.success("업로드 되었습니다.");
      this._cdr.markForCheck();
    }
    catch (err) {
      this._toast.danger(err.message);
      if (process.env.NODE_ENV !== "production") console.error(err);
    }
    this.viewBusyCount--;
    this._cdr.markForCheck();
  }

  public async _getWarehouseType(warehouseName: string): Promise<number | undefined> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      const warehouseTypeInfo = await db.baseType
        .where(item => [
          sorm.equal(item.type, "창고명칭"),
          sorm.includes(item.name, warehouseName)
        ])
        .select(item => ({
          id: item.id
        }))
        .resultAsync();

      if (warehouseTypeInfo && warehouseTypeInfo.length > 0) {
        return warehouseTypeInfo[0].id;
      }
      else {
        const newItem = await db.baseType
          .insertAsync({
            companyId: this._appData.authInfo!.companyId,
            type: "창고명칭",
            name: warehouseName,
            isDisabled: false
          });

        this.typeList.push({
          id: newItem.id!,
          name: warehouseName,
          isDisabled: false
        });

        return newItem.id;
      }
    });
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
      if (this.items.filter(item => (item.typeId === diffTargetItem.typeId && item.name === diffTargetItem.name)).length > 1) {
        this._toast.danger("동일한 값이 입력되어 있습니다 : " + diffTargetItem.name);
        return;
      }

      if (await this._getWarehouseInfo(diffTargetItem.typeId, diffTargetItem.name) > 0) {
        this._toast.danger("동일한 값이 입력되어 있습니다 : " + diffTargetItem.name);
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
          typeId: {
            displayName: "구분",
            notnull: true
          },
          name: {displayName: "명칭", type: String, notnull: true},
          isDisabled: {displayName: "사용중지", type: Boolean, notnull: true}
        }
      );

      await this._orm.connectAsync(MainDbContext, async db => {
        for (const diffTarget of diffTargets) {
          const upsertedItem = await this._saveItem(db, diffTarget);
          diffTarget.id = upsertedItem.id;
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


  private async _saveItem(db: MainDbContext, upsertItem: IWarehouseVM): Promise<IWarehouseVM> {
    // INSERT
    if (!upsertItem.id) {
      if (
        !upsertItem.isDisabled &&
        await db.warehouse
          .where(item => [
            sorm.notEqual(item.isDisabled, true),
            sorm.equal(item.typeId, upsertItem.typeId!),
            sorm.equal(item.name, upsertItem.name!),
            sorm.notEqual(item.id, upsertItem.id!)
          ])
          .countAsync() > 0
      ) {
        throw new Error("\"" + upsertItem.typeId! + "\"에 동일한 이름이 등록되어 있습니다 : " + upsertItem.name!);
      }

      const newItem = await db.warehouse
        .insertAsync({
          companyId: this._appData.authInfo!.companyId,
          typeId: upsertItem.typeId!,
          name: upsertItem.name!,
          rating: upsertItem.rating!,
          isDisabled: upsertItem.isDisabled
        });

      return {
        ...upsertItem,
        id: newItem.id
      };
    }
    // UPDATE
    else {
      await db.warehouse
        .where(item => [
          sorm.equal(item.id, upsertItem.id)
        ])
        .updateAsync(
          () => ({
            companyId: this._appData.authInfo!.companyId,
            typeId: upsertItem.typeId!,
            name: upsertItem.name!,
            rating: upsertItem.rating!,
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

        this.items = await queryable
          .include(item => item.type)
          .orderBy(item => item.id)
          .limit(this.pagination.page * 50, 50)
          .select(item => ({
            id: item.id,
            typeId: item.typeId,
            typeName: item.type!.name,
            name: item.name,
            rating: item.rating,
            isDisabled: item.isDisabled
          }))
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

  private _getSearchQueryable(db: MainDbContext): Queryable<Warehouse> {
    let queryable = db.warehouse
      .where(item => [
        sorm.equal(item.companyId, this._appData.authInfo!.companyId)
      ]);

    if (this.lastFilter!.name) {
      queryable = queryable.where(item => [
        sorm.includes(item.name, this.lastFilter!.name)
      ]);
    }

    if (this.lastFilter!.rating) {
      queryable = queryable.where(item => [
        sorm.equal(item.rating, this.lastFilter!.rating)
      ]);
    }

    if (this.lastFilter!.isDisabled !== false) {
      queryable = queryable.where(item => [
        sorm.notEqual(item.isDisabled, true)
      ]);
    }

    return queryable;
  }

  private async _getWarehouseInfo(typeId: number | undefined, location: string | undefined): Promise<number> {
    return await this._orm.connectAsync(MainDbContext, async db => {
      return await db.warehouse
        .where(item => [
          sorm.equal(item.typeId, typeId),
          sorm.includes(item.name, location)
        ])
        .select(item => ({
          id: item.id
        }))
        .countAsync();
    });
  }
}

interface IFilterVM {
  name?: string;
  rating?: "A" | "B" | "C" | "공통";
  isDisabled: boolean;
}

interface IWarehouseVM {
  id: number | undefined;
  typeId: number | undefined;
  typeName: string | undefined;
  name: string | undefined;
  rating: "A" | "B" | "C" | "공통" | undefined;
  isDisabled: boolean;
}

