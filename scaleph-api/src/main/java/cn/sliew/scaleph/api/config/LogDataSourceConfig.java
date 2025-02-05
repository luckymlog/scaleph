/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package cn.sliew.scaleph.api.config;

import com.baomidou.mybatisplus.autoconfigure.MybatisPlusProperties;
import com.baomidou.mybatisplus.core.MybatisConfiguration;
import com.baomidou.mybatisplus.core.config.GlobalConfig;
import com.baomidou.mybatisplus.core.handlers.MybatisEnumTypeHandler;
import com.baomidou.mybatisplus.core.toolkit.GlobalConfigUtils;
import com.baomidou.mybatisplus.extension.plugins.MybatisPlusInterceptor;
import com.baomidou.mybatisplus.extension.spring.MybatisSqlSessionFactoryBean;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.ibatis.logging.slf4j.Slf4jImpl;
import org.apache.ibatis.logging.stdout.StdOutImpl;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import javax.sql.DataSource;

@Configuration
@MapperScan(basePackages = LogDataSourceConfig.LOG_MAPPER_PACKAGE, sqlSessionFactoryRef = LogDataSourceConfig.LOG_SQL_SESSION_FACTORY)
public class LogDataSourceConfig {

    static final String LOG_ENTITY_PACKAGE = "cn.sliew.scaleph.dao.entity.log";
    static final String LOG_MAPPER_PACKAGE = "cn.sliew.scaleph.dao.mapper.log";
    static final String LOG_MAPPER_XML_PATH = "classpath*:cn.sliew.scaleph.dao.mapper/log/**/*.xml";

    static final String LOG_SQL_SESSION_FACTORY = "logSqlSessionFactory";
    static final String LOG_DATA_SOURCE_FACTORY = "logDataSource";
    static final String LOG_TRANSACTION_MANAGER_FACTORY = "logTransactionManager";

    @Autowired
    private MybatisPlusInterceptor mybatisPlusInterceptor;

    @Bean(LOG_DATA_SOURCE_FACTORY)
    @ConfigurationProperties(prefix = "spring.datasource.log")
    public DataSource logDataSource() {
        return DataSourceBuilder.create().type(HikariDataSource.class)
                .build();
    }

    @Bean(LOG_TRANSACTION_MANAGER_FACTORY)
    public DataSourceTransactionManager logTransactionManager() {
        return new DataSourceTransactionManager(logDataSource());
    }

    @Bean(LOG_SQL_SESSION_FACTORY)
    public SqlSessionFactory logSqlSessionFactory() throws Exception {
        MybatisSqlSessionFactoryBean factoryBean = new MybatisSqlSessionFactoryBean();
        GlobalConfig globalConfig = GlobalConfigUtils.defaults();
        globalConfig.setMetaObjectHandler(new MybatisConfig.MetaHandler());
        MybatisPlusProperties props = new MybatisPlusProperties();
        props.setMapperLocations(new String[]{LOG_MAPPER_XML_PATH});
        factoryBean.setMapperLocations(props.resolveMapperLocations());

        MybatisConfiguration configuration = new MybatisConfiguration();
        configuration.setDefaultEnumTypeHandler(MybatisEnumTypeHandler.class);
        configuration.setMapUnderscoreToCamelCase(true);
        configuration.setLogImpl(Slf4jImpl.class);
        factoryBean.setConfiguration(configuration);
        factoryBean.setGlobalConfig(globalConfig);
        factoryBean.setDataSource(logDataSource());
        factoryBean.setTypeAliasesPackage(LOG_ENTITY_PACKAGE);
        factoryBean.setPlugins(mybatisPlusInterceptor);
        return factoryBean.getObject();
    }

}
