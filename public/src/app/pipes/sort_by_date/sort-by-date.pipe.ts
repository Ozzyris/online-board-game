import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'sortByDate'
})

export class SortByDatePipe implements PipeTransform {
	transform(value: any, args?: any): any {
		if (!value) {
			return [];
		}

		const sortedValues = value.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
		return sortedValues;
	}
}