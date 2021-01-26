import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'sortBy'
})

export class SortbyPipe implements PipeTransform {
	transform(array: any, field: string, current_name: string): any[] {
		if (!Array.isArray(array)) {
			return;
		}
		array.sort((a: any, b: any) => {
			if( a[field] == current_name){
				return -2;
			}else if (a[field] > b[field]) {
				return 1;
			} else if (a[field] < b[field]) {
				return -1;
			} else {
				return 0;
			}
		});

		return array;
	}
}
