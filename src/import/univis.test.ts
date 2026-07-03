import { describe, expect, it } from 'vitest'
import { termsForDate } from './univis'

describe('rolling CAU semester window',()=>{
  it('uses current summer and upcoming winter from April through September',()=>{
    expect(termsForDate(new Date(2026,3,1))).toEqual({even:'2026s',odd:'2026w'})
    expect(termsForDate(new Date(2026,8,30))).toEqual({even:'2026s',odd:'2026w'})
  })
  it('uses current winter and upcoming summer from October through December',()=>{
    expect(termsForDate(new Date(2026,9,1))).toEqual({odd:'2026w',even:'2027s'})
  })
  it('keeps the winter that began last year from January through March',()=>{
    expect(termsForDate(new Date(2027,0,15))).toEqual({odd:'2026w',even:'2027s'})
  })
})
