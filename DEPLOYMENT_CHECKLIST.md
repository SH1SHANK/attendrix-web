# Implementation Checklist & Best Practices

## Pre-Deployment Checklist

### 1. Database Setup

- [ ] Verify Supabase project is accessible
- [ ] Confirm all required tables exist:
  - [ ] `timetableRecords`
  - [ ] `attendanceRecords`
  - [ ] `userCourseRecords`
- [ ] Verify table schemas match RPC function expectations
- [ ] Check for any existing RPC functions with same names

### 2. RPC Function Deployment

- [ ] Create `get_today_schedule()` function
- [ ] Create `get_upcoming_classes()` function
- [ ] Create `get_classes_by_date()` function
- [ ] Test each function with sample data
- [ ] Verify error handling for edge cases
- [ ] Check function execution time (should be < 500ms)
- [ ] Create indexes for performance optimization

### 3. Type Safety

- [ ] Run TypeScript type checks: `npm run type-check`
- [ ] Verify Supabase type generation: `supabase gen types`
- [ ] Update types/supabase-academic.ts if needed
- [ ] Ensure all RPC return types match TypeScript interfaces

### 4. Testing

- [ ] Test dashboard page loads without errors
- [ ] Verify today's schedule displays correctly
- [ ] Verify upcoming classes load
- [ ] Test date picker changes dates
- [ ] Test with different user batches
- [ ] Verify error messages display properly
- [ ] Test network failures are handled gracefully

### 5. Performance

- [ ] Run performance test with your actual data volume
- [ ] Check dashboard load time (should be < 2s)
- [ ] Monitor RPC function execution times
- [ ] Verify no N+1 queries
- [ ] Check memory usage on client

### 6. Error Handling

- [ ] Test with missing user data
- [ ] Test with empty schedule
- [ ] Test with network errors
- [ ] Test with malformed dates
- [ ] Verify error messages are helpful
- [ ] Check console logs for debugging info

### 7. UI/UX

- [ ] Verify loading states display correctly
- [ ] Check skeleton loaders appear during fetch
- [ ] Verify transitions between states are smooth
- [ ] Test on different screen sizes
- [ ] Test on mobile devices
- [ ] Verify animations are not too slow

## Deployment Strategy

### Stage 1: Development

```bash
# 1. Create RPC functions in dev environment
# 2. Deploy updated client code to dev
# 3. Run full test suite
# 4. Get team approval
```

### Stage 2: Staging

```bash
# 1. Deploy RPC functions to staging DB
# 2. Deploy client code to staging
# 3. Perform integration testing
# 4. Load testing with realistic data
# 5. Final review and approval
```

### Stage 3: Production

```bash
# 1. Create database backup
# 2. Deploy RPC functions during maintenance window
# 3. Deploy client code gradually (canary release)
# 4. Monitor error rates and performance
# 5. Be ready to rollback if issues arise
```

## Monitoring & Observability

### Key Metrics to Monitor

1. **RPC Function Performance**
   - Execution time (should be < 500ms)
   - Success rate (should be > 99%)
   - Error rate (should be < 0.1%)

2. **Client-Side Metrics**
   - Page load time
   - Time to interactive
   - API response times
   - Error boundary triggers

3. **User Experience**
   - Session duration
   - Page visit duration
   - Feature usage frequency
   - Error occurrences per user

### Setup Monitoring

```typescript
// Add performance monitoring in dashboard
if (typeof window !== "undefined" && window.performance) {
  const navigation = performance.getEntriesByType("navigation")[0];
  console.log(
    "Page load time:",
    navigation.loadEventEnd - navigation.loadEventStart,
  );

  const rpcCalls = performance.getEntriesByType("measure");
  console.log("RPC calls:", rpcCalls);
}
```

## Rollback Plan

### If Issues Occur

1. **Immediate Actions**
   - Revert client code to previous version
   - Monitor error rates
   - Gather error logs

2. **Database Rollback**

   ```sql
   -- Drop problematic RPC functions
   DROP FUNCTION IF EXISTS get_today_schedule(TEXT, TEXT, NUMERIC, DATE);
   DROP FUNCTION IF EXISTS get_upcoming_classes(TEXT);
   DROP FUNCTION IF EXISTS get_classes_by_date(TEXT, TEXT);
   ```

3. **Restore Previous Code**
   ```bash
   git revert <commit-hash>
   npm run build
   npm run deploy
   ```

## Performance Optimization Tips

### Database Level

```sql
-- Add query optimization insights
EXPLAIN ANALYZE SELECT * FROM get_today_schedule(...);

-- Create materialized views for frequently accessed data
CREATE MATERIALIZED VIEW user_attendance_summary AS
SELECT userID, courseID, COUNT(*) as total_attended
FROM attendanceRecords
GROUP BY userID, courseID;

-- Refresh materialized views periodically
REFRESH MATERIALIZED VIEW user_attendance_summary;
```

### Client Level

```typescript
// Implement request caching
const cache = new Map<string, CacheEntry>();

function getCachedRPCData(key: string, ttl: number = 5 * 60 * 1000) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < ttl) {
    return entry.data;
  }
  return null;
}

function setCachedRPCData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}
```

## Troubleshooting Guide

### Issue: "RPC function not found"

**Solution**: Verify function exists in database

```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';
```

### Issue: "Argument type mismatch"

**Solution**: Check parameter types match function signature

```sql
-- View function signature
\df+ get_today_schedule
```

### Issue: "Slow query execution"

**Solution**: Check and optimize indexes

```sql
-- Run EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM get_today_schedule('uid', 'bid', 75, CURRENT_DATE);
```

### Issue: "JSON parsing errors"

**Solution**: Validate JSON data in tables

```sql
-- Check for invalid JSON
SELECT classID FROM timetableRecords
WHERE courseType IS NOT NULL
AND NOT jsonb_typeof(courseType) = 'object';
```

## Compliance & Security

### Security Checklist

- [ ] RPC functions use `SECURITY INVOKER` for proper authorization
- [ ] No sensitive data exposed in error messages
- [ ] Input validation in place (dates, user IDs)
- [ ] SQL injection prevention verified
- [ ] Rate limiting configured if needed

### Data Privacy

- [ ] Only user's own data is returned
- [ ] Batch ID verified matches user's batch
- [ ] No cross-user data leakage
- [ ] Audit logging enabled for sensitive operations

## Documentation

### For Developers

- [ ] Update internal wiki with RPC function documentation
- [ ] Create troubleshooting guide for common issues
- [ ] Document any gotchas or workarounds
- [ ] Provide example RPC calls

### For Operations

- [ ] Runbook for deployment
- [ ] Runbook for rollback
- [ ] Monitoring dashboard setup
- [ ] On-call procedures

## Post-Deployment

### 1 Hour After Deployment

- [ ] Monitor error rates in real-time
- [ ] Check user feedback channels
- [ ] Verify dashboard is accessible

### 24 Hours After Deployment

- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Update documentation if needed

### 1 Week After Deployment

- [ ] Analyze usage patterns
- [ ] Verify performance meets targets
- [ ] Document lessons learned
- [ ] Plan any follow-up improvements

## Optimization Opportunities

### Short Term (Next Sprint)

- [ ] Implement caching for frequently accessed data
- [ ] Add loading state animations
- [ ] Optimize date formatting performance
- [ ] Add error retry logic

### Medium Term (Next Quarter)

- [ ] Implement real-time updates using Supabase Realtime
- [ ] Add pagination for large datasets
- [ ] Implement background sync for offline support
- [ ] Add analytics tracking

### Long Term (Q2+)

- [ ] Consider Redis caching layer
- [ ] Implement GraphQL API
- [ ] Add advanced filtering and search
- [ ] Build mobile app with same architecture

## Questions & Support

If you encounter issues:

1. Check the troubleshooting guide above
2. Review RPC_FUNCTIONS_GUIDE.md for setup issues
3. Check REFACTORING_SUMMARY.md for architecture questions
4. Review error logs in Supabase dashboard
5. Contact the development team

## Version History

| Version | Date       | Changes                              |
| ------- | ---------- | ------------------------------------ |
| 1.0     | 2026-02-03 | Initial release with RPC refactoring |
|         |            | - Removed dashboard optimizations    |
|         |            | - Implemented proper RPC functions   |
|         |            | - Added Supabase best practices      |
