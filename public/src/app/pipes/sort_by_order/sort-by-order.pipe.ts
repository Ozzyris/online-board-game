import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sortByOrder'
})

export class SortByOrderPipe implements PipeTransform {
	transform(array: any): any[] {
		if (!Array.isArray(array)) {
			return;
		}
		array.sort((a: any, b: any) => {
			if (a.game_detail.position > b.game_detail.position) {
				return 1;
			} else if (a.game_detail.position < b.game_detail.position) {
				return -1;
			} else {
				return 0;
			}
		});

		return array;
	}
 }
