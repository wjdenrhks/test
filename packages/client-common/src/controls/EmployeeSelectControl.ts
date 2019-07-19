import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output, ViewChild
} from "@angular/core";
import {
  ISdNotifyPropertyChange,
  SdNotifyPropertyChange,
  SdOrmProvider, SdSelectControl,
  SdTypeValidate
} from "@simplism/angular";
import {Employee, MainDbContext} from "@sample/main-database";
import {sorm} from "@simplism/orm-query";
import {Queryable} from "@simplism/orm-client";

@Component({
  selector: "app-employee-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <sd-select [(value)]="value"
               (valueChange)="valueChange.emit($event)"
               [disabled]="disabled"
               [required]="required"
               (textfieldFocusedChange)="onTextfieldFocusedChange($event)">
      <sd-dock-container>
        <sd-dock>
          <sd-textfield [(value)]="text"
                        (valueChange)="onTextChange($event)"></sd-textfield>
        </sd-dock>
        <!-- <sd-dock class="sd-padding-sm-default sd-background-grey-lightest">
           <sd-pagination [page]="pagination.page" [length]="pagination.length"
                          (pageChange)="onPageClick($event)"></sd-pagination>
         </sd-dock>-->

        <sd-busy-container [busy]="busy" class="sd-border-top-default">
          <sd-select-item *ngFor="let item of employeeList; trackBy: trackByIdFn"
                          [value]="item.id">
            {{ item.name + '(' + item.userId + ')' }}
          </sd-select-item>
        </sd-busy-container>
      </sd-dock-container>
    </sd-select>
  `
})
export class EmployeeSelectControl implements ISdNotifyPropertyChange {
  @Input()
  @SdTypeValidate(Number)
  @SdNotifyPropertyChange()
  public value?: number;

  @Input()
  @SdTypeValidate(Boolean)
  public required?: boolean;

  @Input()
  @SdTypeValidate(Array)
  public employeeList?: IEmployeeVM[] = [];

  @Input()
  @SdTypeValidate(Boolean)
  public disabled?: boolean;

  @Output()
  public readonly valueChange = new EventEmitter<number>();

  @Input()
  @SdTypeValidate(String)
  public text?: string;

  @ViewChild(SdSelectControl)

  @Output()
  public readonly selectedItemChange = new EventEmitter<IEmployeeVM | undefined>();

  public busy?: boolean;
  public lastFilter?: {
    text?: string;
  };
  public id?: number;

  public pagination = {page: 0, length: 0};

  private _textChangeTimeout?: number;

  public trackByIdFn = (index: number, item: IEmployeeVM) => item.id || item;

  public constructor(private readonly _orm: SdOrmProvider,
                     private readonly _cdr: ChangeDetectorRef) {
  }

  public async sdOnPropertyChange(propertyName: string, oldValue: any, newValue: any): Promise<void> {
    if (propertyName === "value" && newValue) {
      const value = newValue as number;

      this.employeeList = this.employeeList || [];
      const hasNotExistsId = !this.employeeList.some(item1 => item1.id === value);

      if (hasNotExistsId) {
        this.lastFilter = {
          text: this.text
        };
        this.id = value;
        await this._search();
      }
      this._cdr.markForCheck();
    }
  }

  public onTextChange(text?: string): void {
    this.text = text;
    this.id = undefined;
    this.busy = true;
    window.clearTimeout(this._textChangeTimeout);
    this._textChangeTimeout = window.setTimeout(
      async () => {
        this.lastFilter = {
          text: this.text
        };

        await this._search();

        this.busy = false;
      },
      100
    );
  }

  public async onPageClick(page: number): Promise<void> {
    this.pagination.page = page;
    await this._search();
    this._cdr.markForCheck();
  }

  public async onTextfieldFocusedChange(focused: boolean): Promise<void> {
    if (focused) {
      this.lastFilter = {
        text: this.text
      };

      await this._search();
    }
  }

  private async _search(): Promise<void> {
    await this._orm.connectAsync(MainDbContext, async db => {
      const queryable = this._getSearchQueryable(db);

      this.employeeList = await queryable
        .orderBy(item => item.id)
        .select(item => ({
          id: item.id!,
          name: item.name,
          userId: item.userId
        }))
        .resultAsync();

      const totalCount = await queryable.countAsync();
      this.pagination.length = Math.ceil(totalCount / 10);

    });

    this._cdr.markForCheck();
  }

  private _getSearchQueryable(db: MainDbContext): Queryable<Employee> {
    this.lastFilter!.text = this.text || "";
    return db.employee
      .where(item => [
        sorm.equal(item.isDisabled, false),
        sorm.equal(item.department, "생산부"),
        this.id ?
          sorm.equal(item.id, this.id)
          : sorm.or([
            sorm.includes(item.name, this.lastFilter!.text || ""),
            sorm.includes(item.userId, this.lastFilter!.text || "")
          ])
      ]);

  }
}

interface IEmployeeVM {
  id: number;
  userId: string;
  name: string;
}

//TODO: select contorl 안에서 클릭해도 문제없도록 수정
