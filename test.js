function binarySearch(anArray, searchVal, arraySortDir = 'asc') {
    /**Binary Search the sorted primitive data array for a value and return the index.
     * ArraySortDir specifies the direction in which the array is sorted (desc or asc).
     * If the array contains the value searched for, then the index returned is the location of this value on the array,
     * otherwise, the index is of closest value in the array the is before or after the search value.
     */
      function compare(value1, value2, sortDir) {        
          const returnValue = (arraySortDir === 'desc'? -1 : 1);
          if (value1 > value2)
              return returnValue;
          else if (value1 < value2)
              return -returnValue;
          else
              return 0;
      }
  
      const sortDirections = ['asc', 'desc']
      if (!['asc', 'desc'].includes(arraySortDir))
          throw new Error(`arraySortDir must be one of ${arraySortDir}`);
  
      let start = 0,
          end = anArray.length - 1;
  
      while(start < end) {
          if (compare(anArray[start], searchVal) === 0)
              return start;
          else if (compare(anArray[end], searchVal) === 0)
              return end;
  
          const mid = Math.trunc((start + end) / 2);
          const comparison = compare(anArray[mid], searchVal, arraySortDir);
          if (comparison < 0)
              start = mid + 1;
          else if (comparison > 0)
              end = mid - 1;
          else
              return mid;
      } // while(start < end) {
  
      return start;
  } // function binarySearch(anArray, searchVal, arraySortDir) {
/*
const anArray = [1, 3, 5, 7, 9, 11, 15, 17, 21, 25, 30, 40, 46];
anArray.reverse();
console.log(anArray);
const index = binarySearch(anArray, 8, 'desc');
console.log({index});
*/



    function binarySearchObj(objArray, searchObj, startFrom = 0, ...comparisonFields) {
    /**Binary Search the sorted (ascending or descending order) array of objects for a value and return the index.
     * The assumption is that the array is sorted in order of comparison fields.
     * SearchObj comparisonFields array have nested comparison fields. Example of comparison fields: 
     * ['lastName asc', 'firstName', 'address.province asc', 'address.townOrCity asc' ]
     * If the array contains the object with values searched for, then the index returned is the location of this value in the array,
     * otherwise, the index is of the closest value in the array that is before or after the searchObj value.
     * Assumed field data types are Number, String and Date.
     */
        let start = startFrom,
            end = objArray.length - 1;
    
        while(start < end) {
            if (objCompare(objArray[start], searchObj, ...comparisonFields) === 0)
                return start;
            else if (objCompare(objArray[end], searchObj, ...comparisonFields) === 0)
                return end;
    
            let mid = Math.trunc((start + end) / 2);
    
            if (objCompare(objArray[mid], searchObj, ...comparisonFields) < 0)
                start = mid + 1;
            else if (objCompare(objArray[mid], searchObj, ...comparisonFields) > 0)
                end = mid - 1;
            else
                return mid;
        } // while(start < end) {
        
        return start;
    } // export function binarySearchObj(objArray, searchObj, ...comparisonFields) {
    
    
    /**Create an array with no duplicate value set of comparison fields. Taking only the first of each duplicate objects.
     * firstOfDuplicates = true means the first element in a set of duplicates is taken.
     * Otherwise the last element in the set of duplicates is taken.
     * Assumed field data types are Number, String and Date.
     */
    function getObjArrayWithNoDuplicates(objArray, firstOfDuplicates, ...comparisonFields) {

        function getNextSearchObj(pNext) {
            const nextObj = {...objArray[next]};
            let lastField;
            if (comparisonFields.length > 0)
                lastField = comparisonFields[comparisonFields.length - 1].split(' ');
            else
                throw new Error('Supply atleast 1 comparisonFields parameter.');
    
            const lastFieldName = lastField[0];
            const sortDir = lastField.length > 1? lastField[1] : 'asc';
            if (typeof nextObj[lastFieldName] === 'number') {
                if (sortDir === 'asc')
                    nextObj[lastFieldName] =  1e-09 + nextObj[lastFieldName];
                else
                    nextObj[lastFieldName] = -1e-09 + nextObj[lastFieldName];
            }
            else if (typeof nextObj[lastFieldName] === 'string') { // instance of String
                if (sortDir === 'asc')
                    nextObj[lastFieldName] =  nextObj[lastFieldName] + ' ';
                else
                    nextObj[lastFieldName] = ' ' + nextObj[lastFieldName];
            }
            else if (nextObj[lastFieldName] instanceof Date) {
                if (sortDir === 'asc')
                    nextObj[lastFieldName] = new Date(1 + nextObj[lastFieldName].getTime());
                else
                    nextObj[lastFieldName] =  new Date(-1 + nextObj[lastFieldName]);
            }
            else
                throw new Error(`${lastFieldName} must be type Number, String or Date`);

            return nextObj;
        } // function getNextSearchObj(pNext)

        if (objArray.length <= 1)
            return [...objArray];

        if (![true, false].includes(firstOfDuplicates))
            throw new Error(`firstOfDuplicates must be one of ${[true, false]}`);

        const noDuplicates = [];

        let next = 0;
        let nextSearchObj;
        if ((firstOfDuplicates)) {
            noDuplicates.push(objArray[next]);
        }        
        nextSearchObj = getNextSearchObj(objArray[next]);

        while (next < objArray.length) {
            // The aim is to jump to the next element that is not a duplicate of objArray[next].
            next = binarySearchObj(objArray, nextSearchObj, next, ...comparisonFields);
            let comparison = objCompare(objArray[next], nextSearchObj, ...comparisonFields);
            if (comparison < 0) {
                if (firstOfDuplicates) {
                    next++;
                    if  (next < objArray.length) {
                        noDuplicates.push(objArray[next]);
                        nextSearchObj = getNextSearchObj(objArray[next]);
                    }
                }
                else  {
                    noDuplicates.push(objArray[next]);
                    next++;
                    if (next < objArray.length)
                        nextSearchObj = getNextSearchObj(objArray[next]);
                }
                continue;
            }
            else {
                if (!firstOfDuplicates) {
                    noDuplicates.push(objArray[next]);
                }
                else {
                    noDuplicates.push(objArray[next]);
                }
            }
            
            nextSearchObj = getNextSearchObj(objArray[next]);
            next++;
        } // while (comparison !== 0 && next < objArray.length) {

        return noDuplicates;
    } // export function getObjArrayWithNoDuplicates(objArray, ...comparisonFields) {

    function objCompare(obj1, obj2, ...comparisonFields) {
    /**Compare 2 objects according to the comparison fields specified in the comparison fields array, and return the result.
     * Each element of comparisonFields must be of the form 'fieldName sortDirection' or 'fieldName'. Sort directions 'asc', 'desc'
     * Examples: ['lastName desc'], ['firstName']
     * If sort direction is not provided, then it is assumed to be ascending.
    */
        if (comparisonFields.length === 0)
            throw new Error('comparisonFields not supplied!');
    
        const sortDirections = ['', 'asc', 'desc'];
        for (const index in comparisonFields) {
            const field = comparisonFields[index].split(' ');
            const fieldName = field[0];
            let sortDir = '';
            if (field.length === 2)
                sortDir = field[1];
    
            if (!sortDirections.includes(sortDir))
                throw new Error('Sort direction must be one of ' + sortDirections.toString());
    
            const value1 = (obj1[fieldName]);
            const value2 = (obj2[fieldName]);
    
            const returnValue = (sortDir === 'desc'? -1: 1);
            if (value1 > value2)
                return returnValue;
            else if (value1 < value2)
                return -returnValue;
        } // for (const field in comparisonFields) {
        return 0;
    } // function comparison(obj1, obj2, ...comparisonFields) {

    const obj0 = {
        listingId: '1009e6df-c417-455b-8eb0-def71d27eec2', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: 'Cks0nfr3m7P5dOffvo3m'
    };
    
    const obj1 = {
        listingId: '1009e6df-c417-455b-8eb0-def71d27eec2', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: 'Cks0nfr3m7P5dOffvo3m'
    };
    
    const obj2 = {
        listingId: '11c185bd-f494-40a6-a2cf-36499c4677c3', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: 'rxEtyLhgGa5U6BjTjqbN'
    };
    
    const obj3 = {
        listingId: '11c185bd-f494-40a6-a2cf-36499c4677c3', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: 'rxEtyLhgGa5U6BjTjqbN'
    };

    const obj4 = {
        listingId: '13b29ca4-7b80-4670-97d5-50697de05e2f', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: 'TwI3Hv7nv0FVPO0oM63y'
    };

    const obj5 = {
        listingId: '13b29ca4-7b80-4670-97d5-50697de05e2f', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: 'fi6Ngi8BDZ29L0DXxNkG'
    };
    
    const obj6 = {
        listingId: '26c85a9d-f9ab-42df-9db3-8064a4a70758', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: 'nXhZpDk3Nzpf2E86edMK'
    };

    const obj7 = {
        listingId: 'adfde666-e139-4ec3-aced-5aa809c026a5', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: '2M1cUXPxCoIRM8KRckXp'
    };

    const obj8 = {
        listingId: 'adfde666-e139-4ec3-aced-5aa809c026a5', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: '4y4TNltB27KcL0iPU6n0'
    };

    const obj9 = {
        listingId: 'adfde666-e139-4ec3-aced-5aa809c026a5', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: 'AO4TehQE7hUU92mhCGbE'
    };
    
    const obj10 = {
        listingId: 'adfde666-e139-4ec3-aced-5aa809c026a5', 
        reason: 'Drugs', 
        reviewed: false, 
        reportId: 'bdgsfMCn0o77bzJcGqCa'
    };

/* const anArray = [obj0, obj1, obj2, obj3, obj4, obj5, obj6, obj7, obj8, obj9, obj10];
const objSearch = {...obj7, listingId: obj7.listingId + ' '};
console.log(objSearch);
console.log(getObjArrayWithNoDuplicates(anArray, false, 'listingId')); */
/*
const anArray = [obj0, obj1, obj2, obj3, obj4, obj5, obj6, obj7, obj8, obj9, obj10];
const objSearch = {...obj0, listingId: obj0.listingId + ' '};
console.log(objSearch);
console.log(binarySearchObj(anArray, objSearch, 0, 'listingId'));
*/
/*
let compare1 = objCompare(obj1, obj2, 'surname', 'firstName', 'dateOfBirth');
let compare2 = objCompare(obj1, obj3, 'dateOfBirth desc');
let compare3 = objCompare(obj1, obj3, 'surname', 'firstName asc');
console.log({
    compare1, compare2, compare3
});
*/
/*
const obj5 = {x: 1, y: 2, z: 5, a: 1};
const obj6 = {x: 1, y: 2, z: 5, a: 2};
const obj7 = {x: 5, y: 2, z: 6, a: 3};
const obj8 = {x: 5, y: 2, z: 6, a: 4};
const anArray = [obj5, obj6, obj7, obj8];
console.log(anArray);
console.log(getObjArrayWithNoDuplicates(anArray, true, 'x', 'y', 'z'));
*/

class Collection {
    constructor(pCollectionName, pData, pMaxNumSelections = null, ...pSortFields) {
        this.sortFields = pSortFields;
        this.collectionName = pCollectionName;  // Name of the collection.
        this.selectedItems = []; // An array of objects that were elected from data.
        this.maxNumSelections = pMaxNumSelections;
        this.data = [...pData];
        this.sortData(...this.sortFields);
    } // constructor(pCollectionName, pData) {

    sortData() {
        this.data.sort(this.comparisonFunction);
    }

    comparisonFunction = (item1, item2)=> {
        // To enable comparison objects must have the sort field.
        if (this.sortFields.length > 0)
            return objCompare(item1, item2, ...this.sortFields);

        return 0;            
    } // comparisonFunction = (item1, item2)=> {

    updateData(pData) {
        this.data = pData.toSorted(this.comparisonFunction);

        // Filter out all the selected items not in the updated data.
        this.selectedItems = this.selectedItems.filter(selectedItem=> {
            return this.data.findIndex(dataItem=> {
                // NB. For accurate equality comparisons, developers must create objects with sorted fields and sorted arrays!!                
                return JSON.stringify(dataItem) === JSON.stringify(selectedItem);
            }) >= 0;
        });

        this.selectedItems = this.selectedItems.toSorted(this.comparisonFunction);
    } // updateData(pData) {

    setSelectedItems(pSelectedItems) {
        if (this.maxNumSelections !== null && pSelectedItems.length > this.maxNumSelections)
            throw new Error('Selected items exceed the maximum number of allowed selections.');

        //  Filter out items not in data.
        pSelectedItems = pSelectedItems.filter(item=> {
            return this.data.findIndex(dataItem=> {
                // NB. For accurate comparisons, developer must create objects with sorted fields and sorted arrays!!
                return JSON.stringify(dataItem) === JSON.stringify(item);
            }) >= 0;
        });

        this.selectedItems = pSelectedItems.toSorted(this.comparisonFunction);
    } // setSelectedItems(pSelectedItems) {

    getData() {
        return this.data;
    }

    getSelectedItems() {
        return this.selectedItems;
    }

    getCollectionName() {
        return this.collectionName;
    }

    getMaxNumSelections() {
        return this.maxNumSelections;
    }
} // class Collection {
/*
const aCollection = new Collection('users', [obj1, obj2, obj3, obj4], 1, 'listingId',  'reportId');
console.log(aCollection.getData());
*/
/*

console.log(binarySearch(anotherArray, 18.1));*/
/* const anotherArray = [3, 3, 3, 6, 6, 6, 6, 6, 9, 12, 15, 18, 18, 18, 18, 18];
console.log((anotherArray.slice(3, 4))); */
console.log(' adc5a169-537f-49e8-bab1-5143e2647aa6' < 'adc5a169-537f-49e8-bab1-5143e2647aa6 ');
let result = ['/explore', '/search', '/search/offers', '/my-profile'].includes('/my-profile/listings');
console.log({result});
