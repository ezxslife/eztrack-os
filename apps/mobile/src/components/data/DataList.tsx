import React from 'react';
import {
  FlatList,
  FlatListProps,
  RefreshControl,
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '@/theme';
import { EmptyState } from '../feedback/EmptyState';
import { ErrorState } from '../feedback/ErrorState';
import { SkeletonLoader } from '../feedback/SkeletonLoader';

interface DataListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem' | 'keyExtractor'> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement | null;
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: string;
  isError?: boolean;
  errorTitle?: string;
  errorSubtitle?: string;
  onRetry?: () => void;
  ListHeaderComponent?: React.ReactElement | null;
  contentContainerStyle?: ViewStyle;
  skeletonCount?: number;
}

export function DataList<T>({
  data,
  renderItem,
  keyExtractor,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onEndReached,
  emptyTitle = 'No items yet',
  emptySubtitle = 'Pull to refresh or try again later',
  emptyIcon = 'inbox.circle',
  isError = false,
  errorTitle = 'Something went wrong',
  errorSubtitle = 'Pull to refresh or tap retry to try again',
  onRetry,
  ListHeaderComponent,
  contentContainerStyle,
  skeletonCount = 6,
  ...props
}: DataListProps<T>) {
  const colors = useThemeColors();

  const isEmpty = data.length === 0 && !isLoading;

  const renderContent = (): React.ReactElement => {
    if (isLoading && isEmpty) {
      return (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <SkeletonLoader key={index} variant="card" />
          ))}
        </View>
      );
    }

    if (isError && isEmpty) {
      return (
        <ErrorState
          title={errorTitle}
          message={errorSubtitle}
          retryLabel="Retry"
          onRetry={onRetry}
        />
      );
    }

    if (isEmpty) {
      return <EmptyState title={emptyTitle} subtitle={emptySubtitle} icon={emptyIcon} />;
    }

    return (
      <FlatList<T>
        data={data}
        renderItem={({ item, index }) => renderItem(item, index)}
        keyExtractor={keyExtractor}
        scrollEnabled={false}
        {...props}
      />
    );
  };

  return (
    <FlatList<any>
      data={[{ type: 'header' }, { type: 'content' }]}
      keyExtractor={(item) => item.type}
      renderItem={({ item }) => {
        if (item.type === 'header' && ListHeaderComponent) {
          return ListHeaderComponent;
        }
        if (item.type === 'content') {
          return renderContent();
        }
        return null;
      }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      contentContainerStyle={[
        styles.contentContainer,
        contentContainerStyle,
      ]}
      scrollEnabled={!isEmpty || isLoading}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  skeletonContainer: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
