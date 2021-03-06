import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
	name: 'sortByName'
})

export class SortbyNamePipe implements PipeTransform {
	transform(array: any, current_name: string, pipe_updater: string): any[] {
		if (!Array.isArray(array)) {
			return;
		}

		array.sort((a: any, b: any) => {
			if (a.name > b.name) {
				return 1;
			} else if (a.name < b.name) {
				return -1;
			} else {
				return 0;
			}
		});

		return array;
	}
}
