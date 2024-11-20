"use client";

import React from 'react';
import { useUserContext } from '../providers/UserStore';
import { useTranslations } from 'next-intl';

export const UserInfos = () => {
    const { data, isUserLoggedIn, isLoading } = useUserContext();
    const t = useTranslations('Common');

    if (isLoading) {
        return (
            <div className="flex items-center gap-2">
                <span>{t('Loading user info...')}</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {isUserLoggedIn ? (
                <>
                    <span>{t('Welcome')}</span>
                    <strong>{data.name || data.email}</strong>
                    {data.role && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                            {data.role}
                        </span>
                    )}
                </>
            ) : (
                <span>{t('Please log in')}</span>
            )}
        </div>
    );
};
