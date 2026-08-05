import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Brand, Colors } from '@/constants/theme';
import { useCart } from '@/lib/cart-store';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme ?? 'light'];
  const { itemCount } = useCart();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: Brand.yellow } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="home-outline" />}
          selectedColor={Brand.yellow}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="shop">
        <NativeTabs.Trigger.Label>Shop</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'tag', selected: 'tag.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="pricetags-outline" />}
          selectedColor={Brand.yellow}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cart">
        <NativeTabs.Trigger.Label>Cart</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'cart', selected: 'cart.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="cart-outline" />}
          selectedColor={Brand.yellow}
        />
        {itemCount > 0 && <NativeTabs.Trigger.Badge>{String(itemCount)}</NativeTabs.Trigger.Badge>}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="account">
        <NativeTabs.Trigger.Label>Account</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person', selected: 'person.fill' }}
          src={<NativeTabs.Trigger.VectorIcon family={Ionicons} name="person-outline" />}
          selectedColor={Brand.yellow}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
