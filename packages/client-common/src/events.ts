import {SocketEventBase} from "@simplism/angular";

export class AlarmChangedEvent extends SocketEventBase<{ employeeId: number }, undefined> {
}

export class WeightChangedEvent extends SocketEventBase<undefined, { [code: string]: string }> {
}