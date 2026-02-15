export interface QueryParam {
  name: string
  value: any
}

export class CosmosQueryBuilder {
  private queryText = 'SELECT * FROM c'
  private whereConditions: string[] = []
  private queryParams: QueryParam[] = []
  private paramCounter = 0
  private orderByClause: string = ''
  private limitValue: number | null = null
  private offsetValue: number | null = null

  select(fields: string = '*'): CosmosQueryBuilder {
    this.queryText = `SELECT ${fields} FROM c`
    return this
  }

  // Enhanced where method that allows multiple calls
  where(condition: string, ...params: (QueryParam | undefined)[]): CosmosQueryBuilder {
    // Filter out undefined params
    const validParams = params.filter(p => p !== undefined) as QueryParam[]

    this.whereConditions.push(`(${condition})`)
    this.queryParams.push(...validParams)
    return this
  }

  // Helper method to create a where condition with auto-generated parameter names
  whereEqual(field: string, value: any): CosmosQueryBuilder {
    const paramName = `@p${++this.paramCounter}`
    return this.where(`c.${field} = ${paramName}`, { name: paramName, value })
  }

  // Add AND operator
  and(condition: string, ...params: (QueryParam | undefined)[]): CosmosQueryBuilder {
    return this.where(condition, ...params)
  }

  // Add OR operator with a new condition
  or(condition: string, ...params: (QueryParam | undefined)[]): CosmosQueryBuilder {
    if (this.whereConditions.length === 0) {
      return this.where(condition, ...params)
    }

    // Replace the last condition with an OR
    const lastCondition = this.whereConditions.pop()
    this.whereConditions.push(`(${lastCondition} OR ${condition})`)
    this.queryParams.push(...(params.filter(p => p !== undefined) as QueryParam[]))
    return this
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): CosmosQueryBuilder {
    this.orderByClause = ` ORDER BY c.${field} ${direction}`
    return this
  }

  limit(value: number): CosmosQueryBuilder {
    this.limitValue = value
    // Only add the param if it doesn't exist already
    if (!this.queryParams.some(p => p.name === '@limit')) {
      this.queryParams.push({ name: '@limit', value })
    } else {
      // Update existing param
      const param = this.queryParams.find(p => p.name === '@limit')
      if (param) param.value = value
    }
    return this
  }

  offset(value: number): CosmosQueryBuilder {
    this.offsetValue = value
    // Only add the param if it doesn't exist already
    if (!this.queryParams.some(p => p.name === '@offset')) {
      this.queryParams.push({ name: '@offset', value })
    } else {
      // Update existing param
      const param = this.queryParams.find(p => p.name === '@offset')
      if (param) param.value = value
    }
    return this
  }

  build(): { query: string; params: QueryParam[] } {
    let finalQuery = this.queryText

    // Add WHERE clause after SELECT...FROM but before other clauses
    if (this.whereConditions.length > 0) {
      finalQuery += ' WHERE ' + this.whereConditions.join(' AND ')
    }

    // Add ORDER BY
    finalQuery += this.orderByClause

    // Always add OFFSET before LIMIT if LIMIT is specified,
    // automatically adding OFFSET 0 if needed
    if (this.limitValue !== null) {
      // If offset wasn't specified but limit was, add offset 0
      if (this.offsetValue === null) {
        this.offset(0)
      }

      finalQuery += ' OFFSET @offset LIMIT @limit'
    } else if (this.offsetValue !== null) {
      // If only offset was specified (unusual case)
      finalQuery += ' OFFSET @offset'
    }

    return {
      query: finalQuery,
      params: this.queryParams,
    }
  }
}

export function createQuery(): CosmosQueryBuilder {
  return new CosmosQueryBuilder()
}
