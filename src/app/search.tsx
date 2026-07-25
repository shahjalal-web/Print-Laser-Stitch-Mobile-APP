import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';

type SearchResult = {
  handle: string;
  title: string;
  thumbnail: string | null;
  price: string | null;
};

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      api
        .get<{ results: SearchResult[] }>(`/api/search?q=${encodeURIComponent(q)}`)
        .then((res) => setResults(res.results ?? []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <ThemedView style={styles.container}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search products…"
        placeholderTextColor="rgba(255,255,255,0.4)"
        autoFocus
        style={styles.input}
      />

      {loading && <ActivityIndicator style={styles.loader} />}

      {!loading && query.trim().length >= 2 && results.length === 0 && (
        <ThemedText themeColor="textSecondary" style={styles.centerText}>
          No products found.
        </ThemedText>
      )}

      <FlatList
        data={results}
        keyExtractor={(r) => r.handle}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => {
              router.dismiss();
              router.push({
                pathname: '/shop/product/[handle]',
                params: { handle: item.handle, title: item.title, image: item.thumbnail ?? '', price: item.price ?? '' },
              });
            }}>
            <ThemedView type="backgroundElement" style={styles.thumbWrap}>
              {item.thumbnail ? (
                <Image source={{ uri: item.thumbnail }} style={styles.thumb} contentFit="cover" />
              ) : (
                <ThemedText style={styles.thumbFallback}>📦</ThemedText>
              )}
            </ThemedView>
            <ThemedText type="small" style={styles.rowTitle} numberOfLines={1}>
              {item.title}
            </ThemedText>
            {!!item.price && (
              <ThemedText type="small" themeColor="textSecondary">
                ${Number(item.price).toFixed(2)}
              </ThemedText>
            )}
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    color: '#f5f5f5',
  },
  loader: {
    marginTop: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
  list: {
    gap: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  thumbWrap: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    fontSize: 18,
  },
  rowTitle: {
    flex: 1,
  },
});
